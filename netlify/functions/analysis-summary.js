// Helper function for JSON responses
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

// Netlify Function handler for ML analysis summary and AI payload preparation
exports.handler = async (event, context) => {
  console.log('=== Analysis Summary Started ===');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { 
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed' 
    });
  }
  
  try {
    const requestData = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!requestData.results || !Array.isArray(requestData.results)) {
      return jsonResponse(400, {
        success: false,
        code: 'INVALID_INPUT',
        message: 'Missing or invalid results array in request body'
      });
    }
    
    const results = requestData.results;
    const total = results.length;
    
    if (total === 0) {
      return jsonResponse(400, {
        success: false,
        code: 'EMPTY_RESULTS',
        message: 'No results to analyze'
      });
    }
    
    console.log(`Processing ${total} results for analysis summary`);
    
    // Calculate sentiment statistics
    const sentimentCounts = {
      positif: 0,
      netral: 0,
      negatif: 0
    };
    
    const sentimentResults = [];
    let totalConfidence = 0;
    
    // Linguistic feature aggregates
    let totalUppercaseCount = 0;
    let totalUppercaseWordCount = 0;
    let totalPositiveEmoji = 0;
    let totalNegativeEmoji = 0;
    let totalNeutralEmoji = 0;
    let totalIntensifier = 0;
    let totalSoftener = 0;
    let totalNegation = 0;
    let totalExclamation = 0;
    let totalQuestion = 0;
    let totalRepeatedChar = 0;
    let uppercaseCommentCount = 0;
    
    // Word frequency tracking for linguistic analysis
    const intensifierFrequency = {};
    const softenerFrequency = {};
    const negationFrequency = {};
    
    results.forEach((result, index) => {
      const label = result.label || 'netral';
      const confidence = result.confidence || 0;
      const linguistic = result.linguistic_features || {};
      
      // Count sentiments
      if (sentimentCounts[label] !== undefined) {
        sentimentCounts[label]++;
      }
      
      // Accumulate confidence
      totalConfidence += confidence;
      
      // Store result with original data
      sentimentResults.push({
        index: index,
        text: result.text || '',
        label: label,
        confidence: confidence,
        linguistic_features: linguistic
      });
      
      // Accumulate linguistic features
      totalUppercaseCount += linguistic.uppercase_count || 0;
      totalUppercaseWordCount += linguistic.uppercase_word_count || 0;
      totalPositiveEmoji += linguistic.positive_emoji_count || 0;
      totalNegativeEmoji += linguistic.negative_emoji_count || 0;
      totalNeutralEmoji += linguistic.neutral_emoji_count || 0;
      totalIntensifier += linguistic.intensifier_count || 0;
      totalSoftener += linguistic.softener_count || 0;
      totalNegation += linguistic.negation_count || 0;
      totalExclamation += linguistic.exclamation_count || 0;
      totalQuestion += linguistic.question_count || 0;
      totalRepeatedChar += linguistic.repeated_character_count || 0;
      
      // Count comments with uppercase words
      if (linguistic.uppercase_word_count > 0) {
        uppercaseCommentCount++;
      }
    });
    
    // Calculate percentages
    const positivePercentage = total > 0 ? ((sentimentCounts.positif / total) * 100).toFixed(1) : 0;
    const neutralPercentage = total > 0 ? ((sentimentCounts.netral / total) * 100).toFixed(1) : 0;
    const negativePercentage = total > 0 ? ((sentimentCounts.negatif / total) * 100).toFixed(1) : 0;
    const averageConfidence = total > 0 ? (totalConfidence / total).toFixed(2) : 0;
    
    // Calculate linguistic averages
    const avgUppercaseRatio = total > 0 ? (totalUppercaseWordCount / total).toFixed(2) : 0;
    const avgExclamation = total > 0 ? (totalExclamation / total).toFixed(2) : 0;
    const avgRepeatedChar = total > 0 ? (totalRepeatedChar / total).toFixed(2) : 0;
    
    // Calculate uppercase percentage (comments with uppercase words)
    const uppercasePercentage = total > 0 ? ((uppercaseCommentCount / total) * 100).toFixed(1) : 0;
    
    // Determine dominant sentiment
    let dominantSentiment = 'netral';
    if (sentimentCounts.positif > sentimentCounts.negatif && sentimentCounts.positif > sentimentCounts.netral) {
      dominantSentiment = 'positif';
    } else if (sentimentCounts.negatif > sentimentCounts.positif && sentimentCounts.negatif > sentimentCounts.netral) {
      dominantSentiment = 'negatif';
    }
    
    // Extract representative comments (3 per sentiment class, 250 chars)
    const positiveComments = sentimentResults
      .filter(r => r.label === 'positif')
      .slice(0, 3)
      .map(r => ({ text: r.text.substring(0, 250), confidence: r.confidence }));
    
    const neutralComments = sentimentResults
      .filter(r => r.label === 'netral')
      .slice(0, 3)
      .map(r => ({ text: r.text.substring(0, 250), confidence: r.confidence }));
    
    const negativeComments = sentimentResults
      .filter(r => r.label === 'negatif')
      .slice(0, 3)
      .map(r => ({ text: r.text.substring(0, 250), confidence: r.confidence }));
    
    // Find most common linguistic features (simplified)
    const mostCommonIntensifier = 'N/A';
    const mostCommonSoftener = 'N/A';
    const mostCommonNegation = 'N/A';
    
    // Prepare AI payload (lightweight)
    const aiPayload = {
      sentiment_summary: {
        total_comments: total,
        positive_count: sentimentCounts.positif,
        neutral_count: sentimentCounts.netral,
        negative_count: sentimentCounts.negatif,
        positive_percentage: positivePercentage,
        neutral_percentage: neutralPercentage,
        negative_percentage: negativePercentage,
        dominant_sentiment: dominantSentiment,
        average_confidence: averageConfidence
      },
      linguistic_summary: {
        uppercase_comment_percentage: uppercasePercentage,
        uppercase_word_ratio: avgUppercaseRatio,
        positive_emoji_count: totalPositiveEmoji,
        negative_emoji_count: totalNegativeEmoji,
        neutral_emoji_count: totalNeutralEmoji,
        intensifier_count: totalIntensifier,
        softener_count: totalSoftener,
        negation_count: totalNegation,
        avg_exclamation: avgExclamation,
        avg_question: (totalQuestion / total).toFixed(2),
        avg_repeated_characters: avgRepeatedChar,
        most_common_intensifier: mostCommonIntensifier,
        most_common_softener: mostCommonSoftener,
        most_common_negation: mostCommonNegation
      },
      representative_comments: {
        positive: positiveComments,
        neutral: neutralComments,
        negative: negativeComments
      },
      frequent_terms: frequentTerms,
      model_info: {
        algorithm: 'Multinomial Naive Bayes',
        feature_extraction: 'TF-IDF + Linguistic Features',
        features: 'uppercase, emoji, intensifier, negation, punctuation, repeated characters'
      }
    };
    
    console.log('Analysis summary completed');
    
    return jsonResponse(200, {
      success: true,
      summary: {
        total: total,
        sentiment_counts: sentimentCounts,
        sentiment_percentages: {
          positive: positivePercentage,
          neutral: neutralPercentage,
          negative: negativePercentage
        },
        dominant_sentiment: dominantSentiment,
        average_confidence: averageConfidence,
        linguistic_summary: {
          uppercase_percentage: avgUppercaseRatio,
          total_positive_emoji: totalPositiveEmoji,
          total_negative_emoji: totalNegativeEmoji,
          total_intensifier: totalIntensifier,
          total_negation: totalNegation,
          avg_exclamation: avgExclamation,
          avg_repeated_characters: avgRepeatedChar
        }
      },
      ai_payload: aiPayload,
      results: sentimentResults
    });
    
  } catch (error) {
    console.error('Analysis Summary Error:', error);
    return jsonResponse(500, {
      success: false,
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
};
