"""
Noisy ASR Test Set for robustness benchmarking (70 samples, 10 per class).
Simulates real speech-to-text outputs: missing punctuation, phonetically confused syllables,
run-on sentences, and filler words.
"""
from pathlib import Path
import pandas as pd

import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import PROCESSED_DATA_DIR
from nlp.text_preprocessing import preprocess_for_tfidf

noisy_samples = [
    # Theft (10)
    ("sir mera phone chori ho gya metro station ke bahar se pulsar bike pe do ladke the", "Theft", "hinglish"),
    ("someone took my laptop back from cafe table when i went to wash room", "Theft", "en"),
    ("सब्जी मंडी से पर्स चोरी हो गया जेब कट गई है मेरी पन्द्रह सौ रुपया था", "Theft", "hi"),
    ("bhaiya gadi chori ho gayi activa grey color number 5021 market se", "Theft", "hinglish"),
    ("gold chain snatching near temple red color bike sped away quickly", "Theft", "en"),
    ("बस में सफर करते वक्त किसी ने फोन निकाल लिया जेब से पता नहीं चला", "Theft", "hi"),
    ("shutter toota hua mila dukan ka subah cash box gayab tha", "Theft", "hinglish"),
    ("backpack stolen from train seat when train reached new delhi junction", "Theft", "en"),
    ("घर के बाहर से साइकिल चोरी हो गई है ताला टूटा पड़ा मिला", "Theft", "hi"),
    ("auto me se bag kisine cheen liya jhapta mar kar bhag gaya ladka", "Theft", "hinglish"),

    # Cyber Fraud (10)
    ("electricity bill disconnection ka message aaya tha link daba diya 45000 nikal gaye", "Cyber Fraud", "hinglish"),
    ("sbi bank manager bankar phone kiya bola card block hoga otp manga aur account khali", "Cyber Fraud", "hinglish"),
    ("बिजली बिल काटने का फर्जी मैसेज आया लिंक खोला तो खाते से पैसे कट गए", "Cyber Fraud", "hi"),
    ("telegram job task scam like videos to earn money lost 60000 rupees", "Cyber Fraud", "en"),
    ("olx par sofa bechne ke liye qr code bheja bola scan karo aur paise kat gaye mere", "Cyber Fraud", "hinglish"),
    ("कस्टमर केयर का नंबर सर्च किया रिफंड के नाम पर एनीडेस्क से पैसे ट्रांसफर कर लिए", "Cyber Fraud", "hi"),
    ("mumbai police digital arrest call on skype said drugs found in fedex courier", "Cyber Fraud", "en"),
    ("loan app wale photo morph karke contacts ko bhejne ki dhamki de rahe hain", "Cyber Fraud", "hinglish"),
    ("पैन कार्ड आधार से लिंक करने का लिंक आया 50000 रुपये खाते से कट गए", "Cyber Fraud", "hi"),
    ("unauthorized credit card transaction 40000 rupees without sharing any pin or otp", "Cyber Fraud", "en"),

    # Harassment (10)
    ("ek ladka roz college bus stop se ghar tak bike par peecha karta hai chhedta hai", "Harassment", "hinglish"),
    ("unknown number se continuous abusive calls aur gande messages aa rahe hain", "Harassment", "hinglish"),
    ("एक लड़का रोज बेटी का पीछा करता है और अश्लील इशारे करता है कोचिंग के बाहर", "Harassment", "hi"),
    ("man following me in park during walk trying to block way and passing lewd comments", "Harassment", "en"),
    ("ex boyfriend photos viral karne ki dhamki de raha hai aur blackmail kar raha", "Harassment", "hinglish"),
    ("पड़ोसी रोज शराब पीकर गंदी गंदी गालियां देता है और दरवाजा पीटता है", "Harassment", "hi"),
    ("fake instagram profile created with my pictures and phone number for harassment", "Harassment", "en"),
    ("boss is demanding sexual favors for appraisal sending late night messages", "Harassment", "en"),
    ("दहेज के लिए ससुराल वाले बहन को मानसिक रूप से प्रताड़ित कर रहे हैं और मारपीट", "Harassment", "hi"),
    ("chhedkhani hui hai raste mein do ladko ne hath pakadne ki koshish ki", "Harassment", "hinglish"),

    # Missing Person (10)
    ("mera saat saal ka beta vegetable market se gayab ho gaya hai blue t shirt thi", "Missing Person", "hinglish"),
    ("dada ji jinhe bhoolne ki bimari hai subah se laapata hain ghar nahi laute", "Missing Person", "hinglish"),
    ("मेरी 16 साल की बेटी कोचिंग गई थी वापस नहीं आई फोन भी बंद आ रहा है", "Missing Person", "hi"),
    ("74 year old grandfather with dementia walked out of gate and is missing", "Missing Person", "en"),
    ("chhota bhai mandir gaya tha tab se missing hai koi khabar nahi mil rahi", "Missing Person", "hinglish"),
    ("पति कल सुबह से काम पर निकले थे रात को घर नहीं पहुंचे फोन स्विच ऑफ है", "Missing Person", "hi"),
    ("school bus se bacha utra par ghar nahi pahuncha please search immediately", "Missing Person", "en"),
    ("roommate room lock karke teen din se gayab hai phone unreachable aa raha", "Missing Person", "hinglish"),
    ("मानसिक रूप से कमजोर भाई बाजार से गुम हो गया है कृपया तलाश करें", "Missing Person", "hi"),
    ("young girl aged 18 missing after college hours not reached residence", "Missing Person", "en"),

    # Lost Documents (10)
    ("wallet kho gaya hai dtc bus mein jisme aadhaar card pan card driving licence tha", "Lost Documents", "hinglish"),
    ("indian passport lost at terminal 3 airport taxi counter need police report", "Lost Documents", "en"),
    ("दसवीं और बारहवीं की मूल मार्कशीट और डिग्री ऑटो रिक्शा में छूट गई है", "Lost Documents", "hi"),
    ("bike ki rc book aur insurance paper highway par gir gaya pocket se", "Lost Documents", "hinglish"),
    ("ड्राइविंग लाइसेंस मेट्रो में सफर के दौरान कहीं गिर गया डुप्लीकेट बनवाना है", "Lost Documents", "hi"),
    ("lost original property registration sale deed documents while travelling in cab", "Lost Documents", "en"),
    ("sbi bank passbook aur chequebook market me kahi drop ho gaya hai", "Lost Documents", "hinglish"),
    ("voter identity card and ration card misplaced during house relocation", "Lost Documents", "en"),
    ("आधार कार्ड और पैन कार्ड कोर्ट परिसर में गिर गया है मिसिंग एनसीआर चाहिए", "Lost Documents", "hi"),
    ("office id card and metro smart card dropped somewhere on road", "Lost Documents", "en"),

    # Physical Assault (10)
    ("road rage mein car se nikal kar teen ladko ne lathi rod se mara naak tod di", "Physical Assault", "hinglish"),
    ("four men attacked my brother with iron pipes outside gym broke his left arm", "Physical Assault", "en"),
    ("दुकानदार ने डंडे से सिर पर वार किया गहरा घाव हो गया अस्पताल में टांके लगे", "Physical Assault", "hi"),
    ("theke ke bahar sharabiyo ne chaku maar diya pet me bohot khoon beh raha hai", "Physical Assault", "hinglish"),
    ("attacked with sharp sickle over land dispute deep cuts on arm and chest", "Physical Assault", "en"),
    ("पार्किंग के विवाद में लोहे की रॉड से सिर फोड़ दिया बेहोश होकर गिर पड़ा", "Physical Assault", "hi"),
    ("bouncers ne club ke bahar laat ghuso se buri tarah mara pasli fracture kar di", "Physical Assault", "hinglish"),
    ("drunk youths attacked with beer bottle on head profuse bleeding admitted to trauma", "Physical Assault", "en"),
    ("रास्ते में घेरकर लाठी डंडों से जानलेवा हमला किया शरीर पर कई जगह फ्रैक्चर", "Physical Assault", "hi"),
    ("helmet se muh par attack kiya daant toot gaya physical assault report likho", "Physical Assault", "hinglish"),

    # Other (10)
    ("raat ko 2 baje tak banquet hall me loud dj bajta hai shor se neend nahi aati", "Other", "hinglish"),
    ("neighbor dumping rotten garbage outside our gate everyday health hazard", "Other", "en"),
    ("पड़ोस के मैरिज हॉल में तेज लाउडस्पीकर बजता है पढ़ाई नहीं हो पा रही है", "Other", "hi"),
    ("illegal car welding and paint workshop in residential basement causing chemical smoke", "Other", "en"),
    ("गली के आवारा कुत्ते बच्चों को काटने दौड़ते हैं टेरर बना हुआ है कॉलोनी में", "Other", "hi"),
    ("public footpath par pakka encroachment kar liya hai rasta pura band ho gaya", "Other", "hinglish"),
    ("lost bunch of house keys and lock somewhere in market during shopping", "Other", "en"),
    ("पार्क में खुलेआम शराब पीकर हुड़दंग करते हैं लड़के बोतलें फोड़ते हैं", "Other", "hi"),
    ("water pipeline tod di kisine sadak par pani bhar gaya civic issue hai", "Other", "hinglish"),
    ("loud generator running on rooftop of coaching center vibrating whole building", "Other", "en"),
]

df = pd.DataFrame(noisy_samples, columns=["raw_text", "category", "language"])
df["text"] = df["raw_text"].apply(preprocess_for_tfidf)
df.to_csv(PROCESSED_DATA_DIR / "noisy_asr_test.csv", index=False, encoding="utf-8")
print(f"Created {len(df)} noisy ASR test samples at {PROCESSED_DATA_DIR / 'noisy_asr_test.csv'}")
