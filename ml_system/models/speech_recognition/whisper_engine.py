import io
import logging
import os
import time
import wave
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from config import WHISPER_COMPUTE_TYPE, WHISPER_DEVICE, WHISPER_MODEL_DIR, WHISPER_MODEL_SIZE

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ.setdefault("HF_HUB_OFFLINE", "1")

# Patch PyAV if metadata_errors is rejected in av.open (PyAV v14+)
try:
    import av
    _orig_av_open = av.open
    def _safe_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _orig_av_open(*args, **kwargs)
    av.open = _safe_av_open
except Exception:
    pass

logger = logging.getLogger("WhisperEngine")


class WhisperEngine:
    _instance: Optional["WhisperEngine"] = None

    def __init__(self, model_size: Optional[str] = None):
        self.model_size = model_size or WHISPER_MODEL_SIZE
        self.device = WHISPER_DEVICE
        self.compute_type = WHISPER_COMPUTE_TYPE
        self.model = None
        self.is_loaded = False
        self.initialization_error: Optional[str] = None
        self._init_model()

    @classmethod
    def get_instance(cls, model_size: Optional[str] = None) -> "WhisperEngine":
        if cls._instance is None:
            cls._instance = cls(model_size=model_size)
        return cls._instance

    def _init_model(self):
        """Attempt to load faster-whisper model."""
        WHISPER_MODEL_DIR.mkdir(parents=True, exist_ok=True)
        try:
            from faster_whisper import WhisperModel
            logger.info(
                f"Initializing faster-whisper (size={self.model_size}, device={self.device}, compute_type={self.compute_type})..."
            )
            self.model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                download_root=str(WHISPER_MODEL_DIR),
                cpu_threads=1,
            )
            self.is_loaded = True
            logger.info("faster-whisper model successfully initialized.")
        except Exception as e:
            self.initialization_error = str(e)
            self.is_loaded = False
            logger.warning(
                f"faster-whisper runtime could not be initialized on this host: {e}. "
                "Notice: Windows Application Control or CTranslate2 native binary constraints may be active. "
                "Audio validation and metadata pipeline will run in fallback diagnostic mode."
            )

    def get_status(self) -> Dict[str, Any]:
        return {
            "engine": "faster-whisper",
            "model_size": self.model_size,
            "device": self.device,
            "compute_type": self.compute_type,
            "is_loaded": self.is_loaded,
            "download_root": str(WHISPER_MODEL_DIR),
            "status": "ready" if self.is_loaded else "runtime_unavailable",
            "diagnostic_message": self.initialization_error,
        }

    def transcribe(
        self,
        audio_input: Union[str, Path, bytes, io.BytesIO],
        language: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Transcribe an audio file or raw byte stream.
        Supports language detection (Hindi/English), segment timestamps, and processing time measurement.
        """
        start_time = time.time()

        # Handle file paths vs in-memory bytes
        temp_path: Optional[Path] = None
        if isinstance(audio_input, (bytes, io.BytesIO)):
            content = audio_input if isinstance(audio_input, bytes) else audio_input.getvalue()
            # Detect audio format from magic bytes to ensure correct container demuxing
            ext = ".webm"
            if len(content) >= 4:
                if content[:4] == b"RIFF":
                    ext = ".wav"
                elif content[:3] == b"ID3" or content[:2] == b"\xff\xfb":
                    ext = ".mp3"
                elif content[:4] == b"OggS":
                    ext = ".ogg"
                elif content[:4] == b"fLaC":
                    ext = ".flac"
                elif content[:4] == b"\x1a\x45\xdf\xa3":
                    ext = ".webm"

            temp_path = WHISPER_MODEL_DIR / f"temp_{int(time.time() * 1000)}{ext}"
            with open(temp_path, "wb") as f:
                f.write(content)
            audio_path = str(temp_path)
        else:
            audio_path = str(audio_input)

        try:
            # 1. Validate audio file
            if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
                return {
                    "transcript": "",
                    "detected_language": None,
                    "language_probability": 0.0,
                    "segments": [],
                    "processing_time": round(time.time() - start_time, 3),
                    "status": "error_empty_audio",
                    "error_message": "Audio file is empty or does not exist.",
                }

            # 2. Transcribe using faster-whisper if runtime is loaded
            if self.is_loaded and self.model is not None:
                try:
                    # Provide targeted initial prompt to prevent script hallucinations and prime police domain
                    lang_hint = language if language in ("en", "hi") else None
                    if lang_hint == "hi":
                        prompt = "यह एक पुलिस शिकायत है। ऑनलाइन धोखाधड़ी, साइबर अपराध, बैंक खाता, ओटीपी, पैसे कट गए, चोरी, मारपीट।"
                    elif lang_hint == "en":
                        prompt = "This is a police complaint. Cyber fraud, theft, assault, harassment, missing person, stolen."
                    else:
                        prompt = "यह एक पुलिस शिकायत है। Police complaint: cyber fraud, theft, harassment, assault."

                    segments_generator, info = self.model.transcribe(
                        audio_path,
                        language=lang_hint,
                        beam_size=5,
                        temperature=0.0,  # Greedy decoding to eliminate hallucination loops
                        condition_on_previous_text=False,  # Prevent error propagation across segments
                        no_repeat_ngram_size=3,  # Prevent repetitive loop hallucinations
                        repetition_penalty=1.1,
                        initial_prompt=prompt,
                        vad_filter=False,  # Set to False to avoid external Silero VAD download delays
                    )

                    segments_list = []
                    full_transcript_parts = []
                    for s in segments_generator:
                        segments_list.append({
                            "id": s.id,
                            "start": round(s.start, 2),
                            "end": round(s.end, 2),
                            "text": s.text.strip(),
                        })
                        full_transcript_parts.append(s.text.strip())

                    transcript = " ".join(full_transcript_parts)
                    proc_time = round(time.time() - start_time, 3)

                    return {
                        "transcript": transcript,
                        "detected_language": info.language,
                        "language_probability": round(info.language_probability, 3),
                        "duration_seconds": round(info.duration, 2),
                        "segments": segments_list,
                        "processing_time": proc_time,
                        "status": "success",
                    }
                except Exception as ex:
                    logger.warning(f"Whisper inference error on file: {ex}")
                    # Fall through to diagnostic mode

            # 3. Environment Fallback Diagnostic Mode (e.g. When WDAC blocks native ctranslate2.dll)
            # Inspect WAV properties and return honest status report
            audio_duration = 0.0
            try:
                with wave.open(audio_path, "rb") as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    audio_duration = round(frames / float(rate), 2)
            except Exception:
                audio_duration = 0.0

            proc_time = round(time.time() - start_time, 3)
            return {
                "transcript": "",
                "detected_language": language or "en",
                "language_probability": 0.0,
                "duration_seconds": audio_duration,
                "segments": [],
                "processing_time": proc_time,
                "status": "runtime_policy_blocked",
                "error_message": (
                    f"Audio file received ({os.path.basename(audio_path)}, {audio_duration}s). "
                    f"faster-whisper inference requires CTranslate2 C++ engine which is blocked on this host by "
                    f"Windows Application Control policy. On Linux/unrestricted environments, faster-whisper executes normally."
                ),
            }

        finally:
            if temp_path and temp_path.exists():
                try:
                    os.remove(temp_path)
                except Exception:
                    pass


def transcribe_audio(
    audio_input: Union[str, Path, bytes, io.BytesIO],
    language: Optional[str] = None,
    model_size: Optional[str] = None,
) -> Dict[str, Any]:
    engine = WhisperEngine.get_instance(model_size=model_size)
    return engine.transcribe(audio_input, language=language)
