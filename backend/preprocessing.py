import re
import string
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

class TextPreprocessor:
    def __init__(self):
        factory = StemmerFactory()
        self.stemmer = factory.create_stemmer()
        
        # Indonesian stopwords
        self.stopwords = set([
            'yang', 'dan', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'adalah',
            'itu', 'ini', 'atau', 'juga', 'tidak', 'sudah', 'akan', 'bisa', 'lebih',
            'karena', 'seperti', 'ada', 'mereka', 'kita', 'saya', 'anda', 'kami',
            'mereka', 'dia', 'beliau', 'nya', 'nya', 'si', 'sih', 'dong', 'deh',
            'lah', 'kah', 'tah', 'pun', 'jika', 'apabila', 'kalau', 'sementara',
            'selama', 'setelah', 'sebelum', 'ketika', 'saat', 'hingga', 'sampai',
            'tersebut', 'tersebutlah', 'tersebutpun', 'yaitu', 'yakni', 'ialah',
            'adalah', 'merupakan', 'yakni', 'yaitu', 'ialah', 'adalah', 'merupakan',
            'sebagai', 'oleh', 'dari', 'dalam', 'ke', 'pada', 'kepada', 'terhadap',
            'dengan', 'tanpa', 'melalui', 'lewat', 'via', 'menggunakan', 'pakai',
            'guna', 'buat', 'untuk', 'bagi', 'kepada', 'terhadap', 'tentang',
            'mengenai', 'perihal', 'soal', 'hal', 'masalah', 'persoalan',
            'akan', 'mau', 'ingin', 'hendak', 'bermaksud', 'berniat', 'taksud',
            'maksud', 'niat', 'tujuan', 'arah', 'arahnya', 'menuju', 'ke arah',
            'kepada', 'menuju', 'mendatangi', 'mengunjungi', 'menghampiri',
            'dekat', 'dekatnya', 'hampir', 'hampirnya', 'kurang lebih', 'sekitar',
            'kira-kira', 'perkiraan', 'dugaan', 'perkiraan', 'kira-kira', 'sekitar',
            'juga', 'pun', 'lagi', 'lagipun', 'malahan', 'bahkan', 'apalagi',
            'terutama', 'khususnya', 'khusus', 'spesifik', 'khususnya', 'terutama',
            'umumnya', 'biasanya', 'lazimnya', 'kerap', 'sering', 'acap', 'kerap kali',
            'sering kali', 'acap kali', 'kadang', 'kadang-kadang', 'sesekali',
            'jarang', 'langka', 'sangat jarang', 'tidak pernah', 'tak pernah',
            'belum pernah', 'pernah', 'telah', 'sudah', 'masih', 'belum', 'belum lagi',
            'belum pun', 'belum pula', 'belum juga', 'belum lagi', 'belum pun',
            'belum pula', 'belum juga', 'belum lagi', 'belum pun', 'belum pula',
            'belum juga', 'belum lagi', 'belum pun', 'belum pula', 'belum juga'
        ])
    
    def case_folding(self, text):
        """Convert text to lowercase"""
        return text.lower()
    
    def remove_url(self, text):
        """Remove URLs from text"""
        url_pattern = re.compile(r'http\S+|www\S+|https\S+')
        return url_pattern.sub('', text)
    
    def remove_mention(self, text):
        """Remove mentions (@username) from text"""
        mention_pattern = re.compile(r'@\w+')
        return mention_pattern.sub('', text)
    
    def remove_hashtag_symbol(self, text):
        """Remove hashtag symbol (#) but keep the text"""
        hashtag_pattern = re.compile(r'#')
        return hashtag_pattern.sub('', text)
    
    def remove_emoji(self, text):
        """Remove emojis from text"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags (iOS)
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+",
            flags=re.UNICODE
        )
        return emoji_pattern.sub('', text)
    
    def remove_numbers(self, text):
        """Remove numbers from text"""
        number_pattern = re.compile(r'\d+')
        return number_pattern.sub('', text)
    
    def remove_punctuation(self, text):
        """Remove punctuation from text"""
        return text.translate(str.maketrans('', '', string.punctuation))
    
    def tokenize(self, text):
        """Tokenize text into words"""
        return text.split()
    
    def remove_stopwords(self, tokens):
        """Remove stopwords from tokens"""
        return [token for token in tokens if token not in self.stopwords]
    
    def stemming(self, tokens):
        """Apply stemming to tokens using Sastrawi"""
        return [self.stemmer.stem(token) for token in tokens]
    
    def preprocess(self, text):
        """Apply all preprocessing steps"""
        # Case folding
        text = self.case_folding(text)
        
        # Remove URLs
        text = self.remove_url(text)
        
        # Remove mentions
        text = self.remove_mention(text)
        
        # Remove hashtag symbol
        text = self.remove_hashtag_symbol(text)
        
        # Remove emojis
        text = self.remove_emoji(text)
        
        # Remove numbers
        text = self.remove_numbers(text)
        
        # Remove punctuation
        text = self.remove_punctuation(text)
        
        # Tokenize
        tokens = self.tokenize(text)
        
        # Remove stopwords
        tokens = self.remove_stopwords(tokens)
        
        # Stemming
        tokens = self.stemming(tokens)
        
        # Join tokens back to text
        return ' '.join(tokens)
