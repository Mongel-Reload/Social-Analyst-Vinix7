import re
import string
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

class LinguisticFeatureExtractor:
    """Extract linguistic features from text before preprocessing"""
    
    # Emoji definitions (using set to avoid duplicates)
    POSITIVE_EMOJIS = set(['😊', '😁', '😍', '❤️', '👍', '🎉', '🥳', '😄', '🤗', '💖', '✨', '🌟', '👏', '🙌', '💪'])
    NEGATIVE_EMOJIS = set(['😡', '😠', '😭', '😢', '👎', '💔', '😤', '😞', '😔', '😣', '😫', '😩', '', '🤬'])
    NEUTRAL_EMOJIS = set(['😐', '🤔', '🙃', '😶', '🙂', '😏', '🤷', '😑', '🤨', '😒'])
    
    # Intensifiers (penguat)
    INTENSIFIERS = ['sangat', 'paling', 'banget', 'sekali', 'amat', 'terlalu', 'benar-benar', 'super', 'sungguh']
    
    # Softeners (pelemah) - kurang moved to negations
    SOFTENERS = ['lumayan', 'cukup', 'agak', 'sedikit', 'hampir']
    
    # Negation words (TIDAK dihapus dari stopwords)
    NEGATIONS = ['tidak', 'bukan', 'belum', 'jangan', 'kurang', 'tak', 'nggak', 'gak', 'tiada', 'bukanlah']
    
    def extract_features(self, text):
        """Extract all linguistic features from text"""
        if not text or not isinstance(text, str):
            return self._empty_features()
        
        features = {
            'uppercase_count': self._count_uppercase(text),
            'uppercase_word_count': self._count_uppercase_words(text),
            'uppercase_ratio': self._calculate_uppercase_ratio(text),
            'positive_emoji_count': self._count_emojis(text, self.POSITIVE_EMOJIS),
            'negative_emoji_count': self._count_emojis(text, self.NEGATIVE_EMOJIS),
            'neutral_emoji_count': self._count_emojis(text, self.NEUTRAL_EMOJIS),
            'intensifier_count': self._count_words(text, self.INTENSIFIERS),
            'softener_count': self._count_words(text, self.SOFTENERS),
            'negation_count': self._count_words(text, self.NEGATIONS),
            'exclamation_count': text.count('!'),
            'question_count': text.count('?'),
            'repeated_character_count': self._count_repeated_characters(text)
        }
        
        return features
    
    def _empty_features(self):
        """Return empty feature dict"""
        return {
            'uppercase_count': 0,
            'uppercase_word_count': 0,
            'uppercase_ratio': 0.0,
            'positive_emoji_count': 0,
            'negative_emoji_count': 0,
            'neutral_emoji_count': 0,
            'intensifier_count': 0,
            'softener_count': 0,
            'negation_count': 0,
            'exclamation_count': 0,
            'question_count': 0,
            'repeated_character_count': 0
        }
    
    def _count_uppercase(self, text):
        """Count uppercase characters"""
        return sum(1 for c in text if c.isupper())
    
    def _count_uppercase_words(self, text):
        """Count words that are entirely uppercase"""
        words = text.split()
        return sum(1 for word in words if word.isupper() and len(word) > 1)
    
    def _calculate_uppercase_ratio(self, text):
        """Calculate ratio of uppercase characters to alphabet characters only"""
        # Count only alphabet characters (a-z, A-Z)
        alphabet_chars = sum(1 for c in text if c.isalpha())
        if alphabet_chars == 0:
            return 0.0
        uppercase = self._count_uppercase(text)
        return uppercase / alphabet_chars
    
    def _count_emojis(self, text, emoji_list):
        """Count emojis from a specific category (using set for deduplication)"""
        return sum(text.count(emoji) for emoji in emoji_list)
    
    def _count_words(self, text, word_list):
        """Count occurrences of specific words using regex word boundary (case-insensitive)"""
        text_lower = text.lower()
        count = 0
        for word in word_list:
            # Use regex word boundary to avoid substring matching
            pattern = r'\b' + re.escape(word) + r'\b'
            matches = re.findall(pattern, text_lower)
            count += len(matches)
        return count
    
    def _count_repeated_characters(self, text):
        """Count repeated characters in words (e.g., baguuuus, kereeeen)"""
        count = 0
        words = text.split()
        for word in words:
            # Check for 3+ consecutive same characters
            if re.search(r'(.)\1{2,}', word):
                count += 1
        return count

class TextPreprocessor:
    def __init__(self):
        factory = StemmerFactory()
        self.stemmer = factory.create_stemmer()
        
        # Indonesian stopwords (KECUALI kata negasi)
        negation_words = {'tidak', 'bukan', 'belum', 'jangan', 'kurang', 'tak', 'tiada', 'bukanlah'}
        
        base_stopwords = [
            'yang', 'dan', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'adalah',
            'itu', 'ini', 'atau', 'juga', 'sudah', 'akan', 'bisa', 'lebih',
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
            'belum pernah', 'pernah', 'telah', 'sudah', 'masih', 'belum lagi',
            'belum pun', 'belum pula', 'belum juga', 'belum lagi', 'belum pun',
            'belum pula', 'belum juga', 'belum lagi', 'belum pun', 'belum pula',
            'belum juga', 'belum lagi', 'belum pun', 'belum pula', 'belum juga'
        ]
        
        # Filter out negation words from stopwords
        self.stopwords = set([w for w in base_stopwords if w not in negation_words])
    
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
