import pandas as pd
from pathlib import Path

csv_path = Path(r"D:\AwaazSetu\ml_system\datasets\raw\complaints_dataset.csv")
df = pd.read_csv(csv_path)

# Normalize language column to 'en', 'hi', 'hinglish'
df["language"] = df["language"].str.lower()
lang_map = {"english": "en", "hindi": "hi", "hinglish": "hinglish"}
df["language"] = df["language"].map(lambda x: lang_map.get(x, x))

additional_samples = [
    # Cyber Fraud (15)
    ("fake credit card points redemption link resulted in 32000 rupees debit without otp", "Cyber Fraud", "en", "hand_written"),
    ("received fake courier parcel delivery sms with payment link lost 19500 rupees", "Cyber Fraud", "en", "hand_written"),
    ("caller pretending to be airtel agent claimed sim kyc expired and debited 40000 via screen sharing", "Cyber Fraud", "en", "hand_written"),
    ("online trading investment telegram channel cheated me of seventy five thousand rupees", "Cyber Fraud", "en", "hand_written"),
    ("hacked instagram account asked for 8000 rupees emergency medical money sent via phonepe", "Cyber Fraud", "en", "hand_written"),
    ("बिजली बिल के नाम पर फर्जी लिंक भेजा और खाते से 28000 रुपये साफ कर दिए", "Cyber Fraud", "hi", "hand_written"),
    ("बैंक अधिकारी बनकर कॉल किया और क्रेडिट कार्ड रिन्यूअल के नाम पर 52000 ठग लिए", "Cyber Fraud", "hi", "hand_written"),
    ("ओएलएक्स पर फर्नीचर खरीदने के बहाने क्यूआर कोड भेजकर खाते से 16000 निकाल लिए", "Cyber Fraud", "hi", "hand_written"),
    ("टेलीग्राम वर्क फ्रॉम होम में यूट्यूब लाइक करने के नाम पर 65000 का फ्रॉड हुआ", "Cyber Fraud", "hi", "hand_written"),
    ("फेक लोन ऐप वाले अश्लील तस्वीरें वायरल करने की धमकी देकर जबरन वसूली कर रहे हैं", "Cyber Fraud", "hi", "hand_written"),
    ("bhaiya online cyber fraud hua hai 25000 account se nikal gaye bina kisi otp ke", "Cyber Fraud", "hinglish", "hand_written"),
    ("electricity bill disconnection fake sms par link click kiya toh 34000 kat gaye", "Cyber Fraud", "hinglish", "hand_written"),
    ("task complete karne ke naam par telegram par 50000 deposit karwa ke scam kar diya", "Cyber Fraud", "hinglish", "hand_written"),
    ("olx par qr code bheja aur scan karte hi mere paise kat gaye refund nahi mila", "Cyber Fraud", "hinglish", "hand_written"),
    ("fake customer care number se phone aaya tha anydesk download karwa ke account khali kar diya", "Cyber Fraud", "hinglish", "hand_written"),

    # Harassment (15)
    ("an unknown man continuously waits outside my office building and stalks me to the bus stop every evening", "Harassment", "en", "hand_written"),
    ("ex-boyfriend sent threatening emails to my company management with private manipulated pictures", "Harassment", "en", "hand_written"),
    ("man following my sister on his bike passing vulgar remarks and blowing horn repeatedly", "Harassment", "en", "hand_written"),
    ("continuous abusive calls from multiple virtual voip numbers threatening physical violence", "Harassment", "en", "hand_written"),
    ("landlord making unwelcome sexual advances and threatening eviction if not entertained", "Harassment", "en", "hand_written"),
    ("एक युवक रोज कॉलेज के बाहर मेरी बेटी का पीछा करता है और अश्लील इशारे करता है", "Harassment", "hi", "hand_written"),
    ("अज्ञात नंबर से बार-बार कॉल करके गंदी बातें बोली जा रही हैं और जान से मारने की धमकी दी जा रही है", "Harassment", "hi", "hand_written"),
    ("ससुराल में दहेज के लिए मानसिक उत्पीड़न और प्रताड़ना की जा रही है पीड़िता डिप्रेशन में है", "Harassment", "hi", "hand_written"),
    ("फेसबुक पर मेरी फोटो मॉर्फ करके अश्लील टिप्पणियां की जा रही हैं तुरंत कार्रवाई करें", "Harassment", "hi", "hand_written"),
    ("पड़ोसी रोज रात को शराब के नशे में दरवाजे पर लात मारता है और गालियां बकता है", "Harassment", "hi", "hand_written"),
    ("ek ladka roz tuition se aate waqt bike par peecha karta hai aur chhedkhani karta hai", "Harassment", "hinglish", "hand_written"),
    ("ex partner blackmail kar raha hai private pictures leak karne ki dhamki dekar", "Harassment", "hinglish", "hand_written"),
    ("unknown number se continuous abusive whatsapp messages aa rahe hain mental harassment ho raha hai", "Harassment", "hinglish", "hand_written"),
    ("padosi roz gali galoch karta hai aur darwaza peetta hai aurton par gandi nazar rakhta hai", "Harassment", "hinglish", "hand_written"),
    ("office mein senior manager sexual favor demand kar raha hai complaint darj kijiye", "Harassment", "hinglish", "hand_written"),

    # Missing Person (15)
    ("my 15-year-old school son did not return home from cricket coaching yesterday evening phone switched off", "Missing Person", "en", "hand_written"),
    ("elderly grandmother aged 78 walked out of apartment gate while guard was eating lunch and has not returned", "Missing Person", "en", "hand_written"),
    ("my brother working in noida has been unreachable for 48 hours his room is found locked from outside", "Missing Person", "en", "hand_written"),
    ("young girl aged 18 missing from outside university campus since 3 pm family is extremely worried", "Missing Person", "en", "hand_written"),
    ("father went to bank to withdraw pension at 10 am yesterday and has not returned home since then", "Missing Person", "en", "hand_written"),
    ("मेरा 8 वर्षीय बेटा पार्क में खेलते-खेलते अचानक लापता हो गया है कृपया तलाश करें", "Missing Person", "hi", "hand_written"),
    ("74 वर्षीय दादाजी जिन्हें भूलने की बीमारी है सुबह टहलने निकले थे और घर नहीं लौटे", "Missing Person", "hi", "hand_written"),
    ("मेरी बहन उम्र 20 वर्ष कॉलेज से वापस नहीं आई उसका मोबाइल नंबर बंद आ रहा है", "Missing Person", "hi", "hand_written"),
    ("फैक्ट्री में काम करने वाले पति रात की शिफ्ट के बाद से लापता हैं कोई संपर्क नहीं हो रहा", "Missing Person", "hi", "hand_written"),
    ("हॉस्टल में रहने वाला छात्र दो दिन से गायब है कमरे का ताला लगा हुआ है", "Missing Person", "hi", "hand_written"),
    ("sir mera chhota bhai kal shaam se missing hai market gaya tha wapas nahi aaya", "Missing Person", "hinglish", "hand_written"),
    ("dada ji jinhe memory loss ki problem hai subah se laapata hain rasta bhatak gaye honge", "Missing Person", "hinglish", "hand_written"),
    ("behan tuition gayi thi par wapas nahi aayi shaam ho gayi phone switched off aa raha hai", "Missing Person", "hinglish", "hand_written"),
    ("husband office ke baad se ghar nahi pahuche unka phone band hai missing report likhiye", "Missing Person", "hinglish", "hand_written"),
    ("10 saal ka bacha mohalle se achanak gayab ho gaya hai please gumshudgi darj karo", "Missing Person", "hinglish", "hand_written"),

    # Lost Documents (15)
    ("lost my original driving licence smart card somewhere near metro parking lot need lost certificate", "Lost Documents", "en", "hand_written"),
    ("folder containing my class 10 and 12 original cbse certificates forgotten in auto-rickshaw", "Lost Documents", "en", "hand_written"),
    ("indian passport misplaced somewhere at airport check-in counter need police acknowledgement for re-issue", "Lost Documents", "en", "hand_written"),
    ("vehicle rc smart card and insurance paper dropped from pocket while riding motorcycle", "Lost Documents", "en", "hand_written"),
    ("lost my aadhaar card and pan card while visiting court complex need report for duplicate application", "Lost Documents", "en", "hand_written"),
    ("मेरा ड्राइविंग लाइसेंस मेट्रो ट्रेन में सफर के दौरान कहीं गिर गया है डुप्लीकेट हेतु रिपोर्ट दर्ज करें", "Lost Documents", "hi", "hand_written"),
    ("बस में यात्रा करते समय मूल आधार कार्ड और पैन कार्ड का पर्स कहीं छूट गया है", "Lost Documents", "hi", "hand_written"),
    ("कक्षा 12वीं की मूल अंकतालिका और डिग्री का लिफाफा ऑटो में छूट गया है जो नहीं मिल रहा", "Lost Documents", "hi", "hand_written"),
    ("हवाई अड्डे पर पासपोर्ट खो जाने के संबंध में डुप्लीकेट जारी करवाने हेतु पुलिस सूचना रसीद चाहिए", "Lost Documents", "hi", "hand_written"),
    ("मोटरसाइकिल की आरसी बुक और इंश्योरेंस की प्रति सड़क पर कहीं गिर गई है", "Lost Documents", "hi", "hand_written"),
    ("driving licence kho gaya hai rto mein duplicate apply karne ke liye report chahiye", "Lost Documents", "hinglish", "hand_written"),
    ("aadhaar card aur pan card market mein kahi gir gaya wallet ke sath missing report kaato", "Lost Documents", "hinglish", "hand_written"),
    ("marksheet aur degree certificate auto mein chhoot gaya tha university verification ke liye ncr chahiye", "Lost Documents", "hinglish", "hand_written"),
    ("bike ki rc smart card pocket se gir gayi highway par lost document entry kar do", "Lost Documents", "hinglish", "hand_written"),
    ("passport airport se aate waqt taxi mein kho gaya hai duplicate nikalwana hai", "Lost Documents", "hinglish", "hand_written"),

    # Physical Assault (10)
    ("attacked by three men with iron pipes outside market fracturing my left forearm", "Physical Assault", "en", "hand_written"),
    ("road rage fight where driver punched my face repeatedly causing bloody nose and broken tooth", "Physical Assault", "en", "hand_written"),
    ("stabbed in arm with sharp knife during argument outside restaurant bleeding profusely", "Physical Assault", "en", "hand_written"),
    ("पार्किंग विवाद में लोहे की रॉड से सिर पर वार कर गंभीर रूप से घायल कर दिया अस्पताल में छह टांके आए", "Physical Assault", "hi", "hand_written"),
    ("दुकानदार ने डंडे से पीटकर हाथ की हड्डी तोड़ दी और जान से मारने की धमकी दी", "Physical Assault", "hi", "hand_written"),
    ("ठेके के बाहर शराबियों ने चाकू मारकर पेट में गहरा घाव कर दिया हालत नाजुक है", "Physical Assault", "hi", "hand_written"),
    ("road rage mein car se kheench kar mara peeta lohe ki rod se sar phod diya", "Physical Assault", "hinglish", "hand_written"),
    ("lathi dande se hamla kiya hai dushmano ne hath aur pair mein fracture hua hai", "Physical Assault", "hinglish", "hand_written"),
    ("chaku se hamla hua hai market ke andar bleeding bohot ho rahi hai emergency hai", "Physical Assault", "hinglish", "hand_written"),
    ("bouncers ne club ke bahar laat ghuso se buri tarah peeta pasli tod di", "Physical Assault", "hinglish", "hand_written"),

    # Other (15)
    ("loud speakers playing at deafening volume past 1 am in residential banquet hall disturbing sick patients", "Other", "en", "hand_written"),
    ("neighbor continuously throwing garbage and dirty sewage water at our entrance door creating nuisance", "Other", "en", "hand_written"),
    ("aggressive stray cattle and dogs roaming unchecked on main colony road causing traffic accidents", "Other", "en", "hand_written"),
    ("illegal welding and chemical spray workshop operating in residential basement causing toxic fumes", "Other", "en", "hand_written"),
    ("lost my bunch of house keys and lock somewhere in the market area during shopping", "Other", "en", "hand_written"),
    ("पड़ोस के बैंक्वेट हॉल में रात दो बजे तक तेज आवाज में डीजे बजता है जिससे ध्वनि प्रदूषण हो रहा है", "Other", "hi", "hand_written"),
    ("पड़ोसी जानबूझकर मुख्य दरवाजे के सामने कचरा फेंकता है और टोकने पर झगड़ा करता है", "Other", "hi", "hand_written"),
    ("कॉलोनी के पार्क में खुलेआम शराब पीकर हुड़दंग मचाने वाले लड़कों के खिलाफ कार्रवाई करें", "Other", "hi", "hand_written"),
    ("बाजार में मेरे घर की चाबियों का गुच्छा खो गया है जिसकी मिसिंग एंट्री दर्ज करवानी है", "Other", "hi", "hand_written"),
    ("सरकारी फुटपाथ पर पक्का अतिक्रमण करके आम रास्ता बंद करने की शिकायत", "Other", "hi", "hand_written"),
    ("raat ko 2 baje tak loud dj bajta hai banquet hall mein noise pollution ki complaint hai", "Other", "hinglish", "hand_written"),
    ("padosi roz kachra gate ke aage phekta hai civic issue hai nuisance create kar raha hai", "Other", "hinglish", "hand_written"),
    ("ghar ki chabiyon ka bunch market mein kho gaya hai missing item report likhiye", "Other", "hinglish", "hand_written"),
    ("public park mein alcohol peekar shor machate hain botal todte hain", "Other", "hinglish", "hand_written"),
    ("illegal construction karke colony ka main rasta block kar diya hai", "Other", "hinglish", "hand_written"),
]

add_df = pd.DataFrame(additional_samples, columns=["complaint_text", "category", "language", "source"])
combined = pd.concat([df, add_df], ignore_index=True)

# Deduplicate
combined["norm"] = combined["complaint_text"].str.strip().str.lower()
combined = combined.drop_duplicates(subset=["norm"]).drop(columns=["norm"])

print("New shape:", combined.shape)
print("\nNew class distribution:\n", combined["category"].value_counts())
print("\nNew language distribution:\n", combined["language"].value_counts())

combined.to_csv(csv_path, index=False, encoding="utf-8")
print("Saved successfully!")
