import {API_CONFIG} from './config';

/**
 * Supported Indian languages:
 * English, Hindi, Marathi, Gujarati, Tamil, Kannada, Telugu, Malayalam, Punjabi, Bengali
 */
export type SupportedLang = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'kn' | 'te' | 'ml' | 'pa' | 'bn';

export interface LanguageInfo {
  code: SupportedLang;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {code: 'en', label: 'English', nativeName: 'English'},
  {code: 'hi', label: 'Hindi', nativeName: 'हिन्दी'},
  {code: 'mr', label: 'Marathi', nativeName: 'मराठी'},
  {code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી'},
  {code: 'ta', label: 'Tamil', nativeName: 'தமிழ்'},
  {code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ'},
  {code: 'te', label: 'Telugu', nativeName: 'తెలుగు'},
  {code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം'},
  {code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ'},
  {code: 'bn', label: 'Bengali', nativeName: 'বাংলা'},
];

/**
 * Built-in static local dictionary for instantaneous offline UI display,
 * zero network delay, and resilient fallback if Google Translate quota is exhausted.
 */
const DICTIONARY: Record<SupportedLang, Record<string, string>> = {
  en: {
    'Choose your professional': 'Choose your professional',
    'Good people. Great help.': 'Good people. Great help.',
    'verified professionals nearby': 'verified professionals nearby',
    'Recommended': 'Recommended',
    'Nearest': 'Nearest',
    'Top Rated': 'Top Rated',
    'Price': 'Price',
    'Payment': 'Payment',
    'A job well done': 'A job well done',
    'The finishing touch.': 'The finishing touch.',
    'Pay securely after your service is complete.': 'Pay securely after your service is complete.',
    'Payment method': 'Payment method',
    'Pay': 'Pay',
    'Worker fare (disbursed to worker)': 'Worker fare (disbursed to worker)',
    'Platform service fee': 'Platform service fee',
    'Total payable': 'Total payable',
    'Language': 'Language',
    'Select Language': 'Select Language',
    'Choose your preferred language': 'Choose your preferred language',
    'Close': 'Close',
    'Reviews': 'Reviews',
    'Notifications': 'Notifications',
    'Help & Safety': 'Help & Safety',
    'Raise a complaint': 'Raise a complaint',
    'Processing…': 'Processing…',
    'Payment complete': 'Payment complete',
    'How did it go?': 'How did it go?',
    'Submit review': 'Submit review',
    'Home feels better.': 'Home feels better.',
    'View my bookings': 'View my bookings',
    'Back to home': 'Back to home',
  },
  hi: {
    'Choose your professional': 'अपना सहायक चुनें',
    'Good people. Great help.': 'अच्छे लोग। बेहतरीन मदद।',
    'verified professionals nearby': 'सत्यापित सहायक पास में उपलब्ध',
    'Recommended': 'अनुशंसित',
    'Nearest': 'निकटतम',
    'Top Rated': 'शीर्ष रेटेड',
    'Price': 'कीमत',
    'Payment': 'भुगतान',
    'A job well done': 'शानदार काम',
    'The finishing touch.': 'अंतिम चरण',
    'Pay securely after your service is complete.': 'सेवा पूरी होने के बाद सुरक्षित भुगतान करें।',
    'Payment method': 'भुगतान का तरीका',
    'Pay': 'भुगतान करें',
    'Worker fare (disbursed to worker)': 'सहायक का शुल्क (सहायक को देय)',
    'Platform service fee': 'प्लेटफ़ॉर्म सेवा शुल्क',
    'Total payable': 'कुल देय राशि',
    'Language': 'भाषा',
    'Select Language': 'भाषा चुनें',
    'Choose your preferred language': 'अपनी पसंदीदा भाषा चुनें',
    'Close': 'बंद करें',
    'Reviews': 'समीक्षाएं',
    'Notifications': 'सूचनाएं',
    'Help & Safety': 'सहायता और सुरक्षा',
    'Raise a complaint': 'शिकायत दर्ज करें',
    'Processing…': 'प्रक्रिया जारी है…',
    'Payment complete': 'भुगतान सफल',
    'How did it go?': 'अनुभव कैसा रहा?',
    'Submit review': 'समीक्षा सबमिट करें',
    'Home feels better.': 'घर अब और भी बेहतर है।',
    'View my bookings': 'मेरी बुकिंग देखें',
    'Back to home': 'होम पर वापस जाएं',
  },
  mr: {
    'Choose your professional': 'तुमचा व्यावसायिक निवडा',
    'Good people. Great help.': 'चांगली माणसे. उत्तम मदत.',
    'verified professionals nearby': 'जवळपास पडताळणी केलेले व्यावसायिक',
    'Recommended': 'शिफारस केलेले',
    'Nearest': 'जवळचे',
    'Top Rated': 'सर्वोच्च रेटिंग',
    'Price': 'दर',
    'Payment': 'पेमेंट',
    'A job well done': 'उत्कृष्ट काम',
    'The finishing touch.': 'अंतिम टप्पा',
    'Pay securely after your service is complete.': 'सेवा पूर्ण झाल्यावर सुरक्षितपणे पैसे भरा.',
    'Payment method': 'पेमेंट पद्धत',
    'Pay': 'पैसे द्या',
    'Worker fare (disbursed to worker)': 'कामगार शुल्क (कामगाराला जमा)',
    'Platform service fee': 'प्लॅटफॉर्म सेवा शुल्क',
    'Total payable': 'एकूण देय रक्कम',
    'Language': 'भाषा',
    'Select Language': 'भाषा निवडा',
    'Choose your preferred language': 'तुमची पसंतीची भाषा निवडा',
    'Close': 'बंद करा',
    'Reviews': 'अभिप्राय',
    'Notifications': 'सूचना',
    'Help & Safety': 'मदत आणि सुरक्षितता',
    'Raise a complaint': 'तक्रार नोंदवा',
    'Processing…': 'प्रक्रिया सुरू आहे…',
    'Payment complete': 'पेमेंट पूर्ण झाले',
    'How did it go?': 'काम कसे झाले?',
    'Submit review': 'अभिप्राय सबमिट करा',
    'Home feels better.': 'घर आता अधिक सुंदर वाटत आहे.',
    'View my bookings': 'माझे बुकिंग्स पहा',
    'Back to home': 'मुख्य पृष्ठावर जा',
  },
  gu: {
    'Choose your professional': 'તમારા સહાયક પસંદ કરો',
    'Good people. Great help.': 'સારા લોકો. શ્રેષ્ઠ મદદ.',
    'verified professionals nearby': 'નજીકમાં ચકાસાયેલ સહાયકો',
    'Recommended': 'ભલામણ કરેલ',
    'Nearest': 'સૌથી નજીક',
    'Top Rated': 'ટોપ રેટેડ',
    'Price': 'કિંમત',
    'Payment': 'ચૂકવણી',
    'A job well done': 'ઉત્તમ કાર્ય',
    'The finishing touch.': 'અંતિમ ચરણ',
    'Pay securely after your service is complete.': 'સેવા પૂર્ણ થયા પછી સુરક્ષિત ચૂકવણી કરો.',
    'Payment method': 'ચૂકવણીની પદ્ધતિ',
    'Pay': 'ચૂકવો',
    'Worker fare (disbursed to worker)': 'સહાયક શુલ્ક (સહાયકને ચૂકવવાપાત્ર)',
    'Platform service fee': 'પ્લેટફોર્મ સેવા શુલ્ક',
    'Total payable': 'કુલ ચૂકવવાપાત્ર રકમ',
    'Language': 'ભાષા',
    'Select Language': 'ભાષા પસંદ કરો',
    'Choose your preferred language': 'તમારી પસંદગીની ભાષા પસંદ કરો',
    'Close': 'બંધ કરો',
    'Reviews': 'સમીક્ષાઓ',
    'Notifications': 'સૂચનાઓ',
    'Help & Safety': 'મદદ અને સુરક્ષા',
    'Raise a complaint': 'ફરિયાદ નોંધાવો',
    'Processing…': 'પ્રક્રિયા ચાલુ છે…',
    'Payment complete': 'ચૂકવણી પૂર્ણ થઈ',
    'How did it go?': 'અનુભવ કેવો રહ્યો?',
    'Submit review': 'સમીક્ષા સબમિટ કરો',
    'Home feels better.': 'ઘર હવે વધુ સારું લાગે છે.',
    'View my bookings': 'મારી બુકિંગ જુઓ',
    'Back to home': 'હોમ પર પાછા જાઓ',
  },
  ta: {
    'Choose your professional': 'உங்கள் பணியாளரைத் தேர்வுசெய்க',
    'Good people. Great help.': 'நல்ல மனிதர்கள். சிறந்த உதவி.',
    'verified professionals nearby': 'அருகிலுள்ள சரிபார்க்கப்பட்ட பணியாளர்கள்',
    'Recommended': 'பரிந்துரைக்கப்பட்டது',
    'Nearest': 'மிக அருகில்',
    'Top Rated': 'உயர் மதிப்பீடு',
    'Price': 'விலை',
    'Payment': 'பணம் செலுத்துதல்',
    'A job well done': 'சிறப்பான பணி',
    'The finishing touch.': 'இறுதி கட்டம்',
    'Pay securely after your service is complete.': 'சேவை முடிந்ததும் பாதுகாப்பாக பணம் செலுத்துங்கள்.',
    'Payment method': 'கட்டண முறை',
    'Pay': 'செலுத்துக',
    'Worker fare (disbursed to worker)': 'பணியாளர் கட்டணம் (பணியாளருக்கு வழங்கப்படும்)',
    'Platform service fee': 'தள சேவை கட்டணம்',
    'Total payable': 'மொத்த கட்டணம்',
    'Language': 'மொழி',
    'Select Language': 'மொழியைத் தேர்ந்தெடுக்கவும்',
    'Choose your preferred language': 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    'Close': 'மூடு',
    'Reviews': 'மதிப்புரைகள்',
    'Notifications': 'அறிவிப்புகள்',
    'Help & Safety': 'உதவி மற்றும் பாதுகாப்பு',
    'Raise a complaint': 'புகார் பதிவு செய்யவும்',
    'Processing…': 'செயலாக்குகிறது…',
    'Payment complete': 'பணம் செலுத்துதல் முடிந்தது',
    'How did it go?': 'பணி எவ்வாறு இருந்தது?',
    'Submit review': 'மதிப்பாய்வைச் சமர்ப்பிக்கவும்',
    'Home feels better.': 'வீடு இப்போது புத்துணர்வாக உள்ளது.',
    'View my bookings': 'என் முன்பதிவுகளைக் காண்க',
    'Back to home': 'முகப்புக்குச் செல்க',
  },
  kn: {
    'Choose your professional': 'ನಿಮ್ಮ ಸಹಾಯಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'Good people. Great help.': 'ಉತ್ತಮ ವ್ಯಕ್ತಿಗಳು. ಶ್ರೇಷ್ಠ ಸಹಾಯ.',
    'verified professionals nearby': 'ಹತ್ತಿರದ ಪರಿಶೀಲಿಸಿದ ಸಹಾಯಕರು',
    'Recommended': 'ಶಿಫಾರಸು ಮಾಡಿದ',
    'Nearest': 'ಹತ್ತಿರದ',
    'Top Rated': 'ಉನ್ನತ ರೇಟಿಂಗ್',
    'Price': 'ದರ',
    'Payment': 'ಪಾವತಿ',
    'A job well done': 'ಉತ್ತಮ ಕೆಲಸ',
    'The finishing touch.': 'ಅಂತಿಮ ಹಂತ',
    'Pay securely after your service is complete.': 'ಸೇವೆ ಪೂರ್ಣಗೊಂಡ ನಂತರ ಸುರಕ್ಷಿತವಾಗಿ ಪಾವತಿಸಿ.',
    'Payment method': 'ಪಾವತಿ ವಿಧಾನ',
    'Pay': 'ಪಾವತಿಸಿ',
    'Worker fare (disbursed to worker)': 'ಕೆಲಸಗಾರರ ಶುಲ್ಕ (ಕೆಲಸಗಾರರಿಗೆ ತಲುಪುವ ಮೊತ್ತ)',
    'Platform service fee': 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸೇವಾ ಶುಲ್ಕ',
    'Total payable': 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ',
    'Language': 'ಭಾಷೆ',
    'Select Language': 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'Choose your preferred language': 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    'Close': 'ಮುಚ್ಚಿ',
    'Reviews': 'ವಿಮರ್ಶೆಗಳು',
    'Notifications': 'ಸೂಚನೆಗಳು',
    'Help & Safety': 'ಸಹಾಯ ಮತ್ತು ಸುರಕ್ಷತೆ',
    'Raise a complaint': 'ದೂರು ಸಲ್ಲಿಸಿ',
    'Processing…': 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ…',
    'Payment complete': 'ಪಾವತಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
    'How did it go?': 'ಕೆಲಸ ಹೇಗಿತ್ತು?',
    'Submit review': 'ವಿಮರ್ಶೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    'Home feels better.': 'ಮನೆ ಈಗ ಹೆಚ್ಚು ಸುಂದರವಾಗಿದೆ.',
    'View my bookings': 'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳನ್ನು ನೋಡಿ',
    'Back to home': 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
  },
  te: {
    'Choose your professional': 'మీ సహాయకుడిని ఎంచుకోండి',
    'Good people. Great help.': 'మంచి వ్యక్తులు. గొప్ప సహాయం.',
    'verified professionals nearby': 'సమీపంలోని ధృవీకరించబడిన నిపుణులు',
    'Recommended': 'సిఫార్సు చేయబడినవి',
    'Nearest': 'సమీపంలో ఉన్నవి',
    'Top Rated': 'అత్యుత్తమ రేటింగ్',
    'Price': 'ధర',
    'Payment': 'చెల్లింపు',
    'A job well done': 'అద్భుతమైన పని',
    'The finishing touch.': 'చివరి దశ',
    'Pay securely after your service is complete.': 'సేవ పూర్తయిన తర్వాత సురక్షితంగా చెల్లించండి.',
    'Payment method': 'చెల్లింపు పద్ధతి',
    'Pay': 'చెల్లించండి',
    'Worker fare (disbursed to worker)': 'కార్మికుల రుసుము (కార్మికుడికి బదిలీ చేయబడుతుంది)',
    'Platform service fee': 'ప్లాట్‌ఫామ్ సేవా రుసుము',
    'Total payable': 'మొత్తం చెల్లించవలసిన మొత్తం',
    'Language': 'భాష',
    'Select Language': 'భాషను ఎంచుకోండి',
    'Choose your preferred language': 'మీకు నచ్చిన భాషను ఎంచుకోండి',
    'Close': 'మూసివేయి',
    'Reviews': 'సమీక్షలు',
    'Notifications': 'నోటిఫికేషన్లు',
    'Help & Safety': 'సహాయం మరియు భద్రత',
    'Raise a complaint': 'ఫిర్యాదు చేయండి',
    'Processing…': 'ప్రాసెస్ అవుతోంది…',
    'Payment complete': 'చెల్లింపు పూర్తయింది',
    'How did it go?': 'అనుభవం ఎలా ఉంది?',
    'Submit review': 'సమీక్షను సమర్పించండి',
    'Home feels better.': 'ఇల్లు ఇప్పుడు ఎంతో ఆహ్లాదకరంగా ఉంది.',
    'View my bookings': 'నా బుకింగ్‌లను చూడండి',
    'Back to home': 'హోమ్‌కు తిరిగి వెళ్లండి',
  },
  ml: {
    'Choose your professional': 'നിങ്ങളുടെ സഹായിയെ തിരഞ്ഞെടുക്കുക',
    'Good people. Great help.': 'നല്ല ആളുകൾ. മികച്ച സഹായം.',
    'verified professionals nearby': 'സമീപമുള്ള സാക്ഷ്യപ്പെടുത്തിയ സഹായികൾ',
    'Recommended': 'ശുപാർശ ചെയ്യുന്നവ',
    'Nearest': 'ഏറ്റവും അടുത്തുള്ളവ',
    'Top Rated': 'ഉയർന്ന റേറ്റിംഗ്',
    'Price': 'നിരക്ക്',
    'Payment': 'പേയ്‌മെന്റ്',
    'A job well done': 'മികച്ച ജോലി',
    'The finishing touch.': 'അവസാന ഘട്ടം',
    'Pay securely after your service is complete.': 'സേവനം പൂർത്തിയായ ശേഷം സുരക്ഷിതമായി പണമടയ്ക്കുക.',
    'Payment method': 'പേയ്‌മെന്റ് രീതി',
    'Pay': 'പണമടയ്ക്കുക',
    'Worker fare (disbursed to worker)': 'തൊഴിലാളി വേതനം (തൊഴിലാളിക്ക് നൽകുന്നത്)',
    'Platform service fee': 'പ്ലാറ്റ്‌ഫോം സേവന ഫീസ്',
    'Total payable': 'ആകെ അടയ്ക്കേണ്ട തുക',
    'Language': 'ഭാഷ',
    'Select Language': 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    'Choose your preferred language': 'നിങ്ങൾക്ക് ഇഷ്ടമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക',
    'Close': 'അടയ്ക്കുക',
    'Reviews': 'അവലോകനങ്ങൾ',
    'Notifications': 'അറിയിപ്പുകൾ',
    'Help & Safety': 'സഹായവും സുരക്ഷയും',
    'Raise a complaint': 'പരാതി നൽകുക',
    'Processing…': 'പ്രോസസ്സ് ചെയ്യുന്നു…',
    'Payment complete': 'പേയ്‌മെന്റ് പൂർത്തിയായി',
    'How did it go?': 'അനുഭവം എങ്ങനെ ഉണ്ടായിരുന്നു?',
    'Submit review': 'അവലോകനം സമർപ്പിക്കുക',
    'Home feels better.': 'വീട് ഇപ്പോൾ കൂടുതൽ സുന്ദരമായി.',
    'View my bookings': 'എന്റെ ബുക്കിംഗുകൾ കാണുക',
    'Back to home': 'ഹോമിലേക്ക് മടങ്ങുക',
  },
  pa: {
    'Choose your professional': 'ਆਪਣਾ ਸਹਾਇਕ ਚੁਣੋ',
    'Good people. Great help.': 'ਚੰਗੇ ਲੋਕ। ਵਧੀਆ ਮਦਦ।',
    'verified professionals nearby': 'ਨੇੜਲੇ ਪ੍ਰਮਾਣਿਤ ਸਹਾਇਕ',
    'Recommended': 'ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤਾ',
    'Nearest': 'ਸਭ ਤੋਂ ਨੇੜੇ',
    'Top Rated': 'ਚੋਟੀ ਦਾ ਦਰਜਾ',
    'Price': 'ਕੀਮਤ',
    'Payment': 'ਭੁਗਤਾਨ',
    'A job well done': 'ਸ਼ਾਨਦਾਰ ਕੰਮ',
    'The finishing touch.': 'ਆਖਰੀ ਪੜਾਅ',
    'Pay securely after your service is complete.': 'ਸੇਵਾ ਪੂਰੀ ਹੋਣ ਤੋਂ ਬਾਅਦ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਭੁਗਤਾਨ ਕਰੋ।',
    'Payment method': 'ਭੁਗਤਾਨ ਦਾ ਤਰੀਕਾ',
    'Pay': 'ਭੁਗਤਾਨ ਕਰੋ',
    'Worker fare (disbursed to worker)': 'ਸਹਾਇਕ ਦਾ ਖਰਚਾ (ਸਹਾਇਕ ਨੂੰ ਭੁਗਤਾਨਯੋਗ)',
    'Platform service fee': 'ਪਲੇਟਫਾਰਮ ਸੇਵਾ ਫੀਸ',
    'Total payable': 'ਕੁੱਲ ਭੁਗਤਾਨਯੋਗ ਰਕਮ',
    'Language': 'ਭਾਸ਼ਾ',
    'Select Language': 'ਭਾਸ਼ਾ ਚੁਣੋ',
    'Choose your preferred language': 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ',
    'Close': 'ਬੰਦ ਕਰੋ',
    'Reviews': 'ਸਮੀਖਿਆਵਾਂ',
    'Notifications': 'ਸੂਚਨਾਵਾਂ',
    'Help & Safety': 'ਮਦਦ ਅਤੇ ਸੁਰੱਖਿਆ',
    'Raise a complaint': 'ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ',
    'Processing…': 'ਕਾਰਵਾਈ ਜਾਰੀ ਹੈ…',
    'Payment complete': 'ਭੁਗਤਾਨ ਸਫਲ',
    'How did it go?': 'ਤਜਰਬਾ ਕਿਹੋ ਜਿਹਾ ਰਿਹਾ?',
    'Submit review': 'ਸਮੀਖਿਆ ਜਮ੍ਹਾਂ ਕਰੋ',
    'Home feels better.': 'ਘਰ ਹੁਣ ਹੋਰ ਵਧੀਆ ਲੱਗ ਰਿਹਾ ਹੈ।',
    'View my bookings': 'ਮੇਰੀਆਂ ਬੁਕਿੰਗਾਂ ਦੇਖੋ',
    'Back to home': 'ਮੁੱਖ ਪੰਨੇ ਤੇ ਵਾਪਸ ਜਾਓ',
  },
  bn: {
    'Choose your professional': 'আপনার সহকারী বেছে নিন',
    'Good people. Great help.': 'ভালো মানুষ। দারুণ সাহায্য।',
    'verified professionals nearby': 'কাছাকাছি যাচাইকৃত সহকারী',
    'Recommended': 'সুপারিশকৃত',
    'Nearest': 'নিকটতম',
    'Top Rated': 'শীর্ষ রেটিং',
    'Price': 'মূল্য',
    'Payment': 'পেমেন্ট',
    'A job well done': 'চমৎকার কাজ',
    'The finishing touch.': 'চূড়ান্ত স্পর্শ',
    'Pay securely after your service is complete.': 'কাজ শেষ হওয়ার পর নিরাপদে অর্থ প্রদান করুন।',
    'Payment method': 'পেমেন্ট পদ্ধতি',
    'Pay': 'পরিশোধ করুন',
    'Worker fare (disbursed to worker)': 'কর্মীর পারিশ্রমিক (কর্মীকে সরাসরি প্রদান)',
    'Platform service fee': 'প্ল্যাটফর্ম সার্ভিস ফি',
    'Total payable': 'মোট প্রদেয়',
    'Language': 'ভাষা',
    'Select Language': 'ভাষা নির্বাচন করুন',
    'Choose your preferred language': 'আপনার পছন্দের ভাষা নির্বাচন করুন',
    'Close': 'বন্ধ করুন',
    'Reviews': 'পর্যালোচনা',
    'Notifications': 'বিজ্ঞপ্তি',
    'Help & Safety': 'সহায়তা ও নিরাপত্তা',
    'Raise a complaint': 'অভিযোগ দায়ের করুন',
    'Processing…': 'প্রক্রিয়াকরণ হচ্ছে…',
    'Payment complete': 'পেমেন্ট সম্পন্ন হয়েছে',
    'How did it go?': 'অভিজ্ঞতা কেমন ছিল?',
    'Submit review': 'পর্যালোচনা জমা দিন',
    'Home feels better.': 'বাড়ি এখন আরও সুন্দর লাগছে।',
    'View my bookings': 'আমার বুকিং দেখুন',
    'Back to home': 'হোমে ফিরে যান',
  },
};

/**
 * Dynamic in-memory runtime cache for Google Translate API responses.
 * Avoids repeated billing and enables instant responses on subsequent views.
 */
const dynamicCache: Record<string, Record<string, string>> = {};

/**
 * Translate a phrase to the target language.
 *
 * 1. Returns exact text for English.
 * 2. Checks static built-in dictionary.
 * 3. Checks runtime dynamic translation cache.
 * 4. Calls Google Cloud Translation API v2 if API key is provided in config.ts.
 * 5. Falls back seamlessly to English / static text if network or quota limits fail.
 */
export async function translateText(text: string, targetLang: SupportedLang): Promise<string> {
  if (!text || targetLang === 'en') return text;

  // 1. Check offline dictionary
  const dict = DICTIONARY[targetLang];
  if (dict && dict[text]) {
    return dict[text];
  }

  // 2. Check dynamic cache
  if (dynamicCache[targetLang] && dynamicCache[targetLang][text]) {
    return dynamicCache[targetLang][text];
  }

  // 3. Check Google Cloud Translation API
  const apiKey = API_CONFIG.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return text;
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      return text;
    }

    const data: any = await response.json();
    const translated = data?.data?.translations?.[0]?.translatedText;
    if (translated) {
      if (!dynamicCache[targetLang]) dynamicCache[targetLang] = {};
      dynamicCache[targetLang][text] = translated;
      return translated;
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn('[GoogleTranslate] Error, falling back to local text:', err);
  }

  return text;
}

/**
 * Synchronous translation lookup (instantaneous UI rendering with zero flicker).
 */
export function t(text: string, currentLang: SupportedLang): string {
  if (!text || currentLang === 'en') return text;
  return DICTIONARY[currentLang]?.[text] ?? dynamicCache[currentLang]?.[text] ?? text;
}
