# KokoroLens Dashboard Documentation

## Overview

KokoroLens Social Intelligence Dashboard is a web-based analytics platform for analyzing social media sentiment using machine learning. The dashboard integrates with Meta Graph API to fetch Instagram comments and uses a TF-IDF + Naive Bayes model for sentiment classification.

## Features

### 1. Sentiment Analysis
- **Manual Text Input**: Analyze individual text comments
- **Media Link Input**: Analyze comments from Instagram post URLs
- **Media ID Input**: Analyze comments using Instagram media IDs
- **Real-time Classification**: Uses ML backend for sentiment prediction
- **Fallback Mechanism**: Keyword-based classification if ML fails

### 2. Dashboard
- **Summary Cards**: Display total comments, sentiment percentage, engagement metrics
- **Sentiment Distribution Chart**: Doughnut chart showing positive/neutral/negative breakdown
- **Period Filtering**: Filter data by month and year
- **Dynamic Updates**: Dashboard updates automatically after analysis

### 3. Classification Results
- **Interactive Table**: Displays all classified comments
- **Search**: Filter by username or comment text
- **Sentiment Filter**: Show only positive, neutral, or negative comments
- **Confidence Filter**: Filter by confidence level (High/Medium/Low)
- **Pagination**: Navigate through large datasets (10 items per page)

### 4. Model Evaluation
- **Accuracy Metrics**: Displays model accuracy, precision, recall, F1-score
- **Confusion Matrix**: Visual representation of classification performance
- **Confidence Distribution**: Histogram showing confidence score distribution
- **Error Analysis**: Identifies potential false positives/negatives

### 5. Analysis History
- **Persistent Storage**: Saves analyses to Firebase Firestore
- **User-specific**: Each user sees only their own analyses
- **Load on Startup**: Automatically loads history on app initialization
- **Delete Capability**: Remove individual analyses from history

### 6. Report Generation
- **PDF Export**: Generate executive reports with actual analysis data
- **Executive Summary**: Auto-generated summary of analysis results
- **Sentiment Distribution**: Visual donut chart in report
- **Conclusions**: Data-driven conclusions based on metrics
- **Recommendations**: Actionable insights based on sentiment patterns

### 7. Advanced Features
- **Period Comparison**: Compare metrics between two time periods
- **Word Analysis**: Identify top words and their sentiment associations
- **Data Validation**: Comprehensive input and data validation
- **State Management**: Loading, error, and empty state handling

## Architecture

### Data Structure

```javascript
dashboardData = {
  currentAnalysis: {
    analysis_id: string,
    analysis_date: string,
    source_type: string,
    source_platform: string,
    source_name: string,
    media_id: string,
    media_permalink: string,
    total_comments: number,
    positive_count: number,
    neutral_count: number,
    negative_count: number,
    positive_percentage: number,
    neutral_percentage: number,
    negative_percentage: number,
    average_confidence: number,
    low_confidence_count: number,
    comments: Array,
    model_version: string,
    model_trained_at: string
  },
  analyses: Array,
  engagementData: {
    likes: number,
    comments: number,
    shares: number,
    saves: number,
    reach: number,
    followers: number,
    engagement_rate: number
  },
  filters: {
    month: number,
    year: number
  }
}
```

### Key Functions

#### Sentiment Analysis
- `processSentiment(inputType, text, link, mediaId)`: Main sentiment analysis orchestrator
- `updateClassificationTable(comments)`: Updates classification results table
- `updateDashboardWithAnalysis(analysis)`: Updates dashboard with analysis results

#### Model Evaluation
- `calculateModelMetrics(comments)`: Calculates accuracy, precision, recall, F1-score
- `updateModelEvaluation(comments)`: Updates model evaluation UI
- `createConfidenceChart(comments)`: Creates confidence distribution chart
- `updateErrorAnalysis(comments)`: Updates error analysis section

#### Data Management
- `saveAnalysisToHistory(analysis)`: Saves analysis to Firestore
- `loadAnalysisHistory()`: Loads analysis history from Firestore
- `deleteAnalysisFromHistory(analysisId)`: Deletes analysis from Firestore

#### Validation
- `validateAnalysisData(analysis)`: Validates analysis structure
- `validateEngagementData(data)`: Validates engagement metrics
- `validateInputData(inputType, text, link, mediaId)`: Validates user input
- `sanitizeText(text)`: Sanitizes text for XSS prevention

#### Advanced Analysis
- `comparePeriods(period1, period2)`: Compares metrics between periods
- `calculatePeriodMetrics(analyses)`: Aggregates metrics for a period
- `analyzeWords(comments)`: Performs word frequency analysis
- `displayWordAnalysis(wordData)`: Displays word analysis results

#### UI State Management
- `showLoadingState(elementId, message)`: Shows loading spinner
- `showErrorState(elementId, message, actionText, actionCallback)`: Shows error state
- `showEmptyState(elementId, message, actionText, actionCallback)`: Shows empty state
- `hideState(elementId, content)`: Restores content

## Integration Points

### Meta Graph API
- **Endpoint**: `/.netlify/functions/meta-comments`
- **Authentication**: Uses Firebase Auth tokens
- **Rate Limiting**: Handled by Netlify functions
- **Data Fetched**: Comments, likes, shares, saves, reach

### ML Backend
- **Endpoint**: `/.netlify/functions/ml-predict`
- **Model**: TF-IDF + Multinomial Naive Bayes
- **Input**: Text array
- **Output**: Sentiment labels, confidence scores, probability distributions

### Firebase Firestore
- **Collection**: `users/{userId}/analyses`
- **Document ID**: Analysis ID
- **Storage**: Complete analysis results with metadata

## Configuration

### Required Environment Variables

```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
META_ACCESS_TOKEN=your_meta_access_token
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

### Firebase Configuration
Create `firebase-config.js` with your Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};
```

## Usage Guide

### Performing Sentiment Analysis

1. **Manual Text Input**
   - Select "Teks Manual" from input type dropdown
   - Enter text in the textarea
   - Click "Proses Analisis"

2. **Media Link Input**
   - Select "Link Media" from input type dropdown
   - Enter Instagram post URL
   - Click "Proses Analisis"

3. **Media ID Input**
   - Select "Media ID" from input type dropdown
   - Enter Instagram media ID
   - Click "Proses Analisis"

### Viewing Results

1. **Dashboard**
   - Navigate to "Dashboard" tab
   - View summary cards and sentiment chart
   - Use period filters to view specific time ranges

2. **Classification Results**
   - Navigate to "Sentimen" tab
   - Scroll to "Hasil Klasifikasi" section
   - Use search and filters to find specific comments
   - Click pagination to navigate through results

3. **Model Evaluation**
   - Navigate to "Sentimen" tab
   - Scroll to "Evaluasi Model" section
   - View accuracy metrics and confusion matrix
   - Check confidence distribution chart

4. **Error Analysis**
   - Navigate to "Sentimen" tab
   - Scroll to "Analisis Error" section
   - Review low-confidence comments
   - Check error indicators for potential issues

### Generating Reports

1. **PDF Export**
   - Perform sentiment analysis
   - Navigate to "Laporan" tab
   - Click "Export PDF" button
   - PDF will download with current analysis data

### Managing History

1. **View History**
   - History loads automatically on app initialization
   - View previous analyses in the history section

2. **Delete Analysis**
   - Click delete button next to analysis in history
   - Confirm deletion
   - Analysis will be removed from Firestore

## Troubleshooting

### Common Issues

1. **Meta API Connection Failed**
   - Verify META_ACCESS_TOKEN is valid
   - Check Meta App permissions
   - Ensure rate limits not exceeded

2. **ML Prediction Failed**
   - Check ML backend is running
   - Verify input data format
   - Fallback to keyword-based classification will activate

3. **Firestore Not Saving**
   - Verify Firebase configuration
   - Check user is authenticated
   - Ensure Firestore rules allow writes

4. **PDF Export Failed**
   - Ensure html2canvas and jspdf libraries are loaded
   - Check browser console for errors
   - Try using browser print as fallback

### Performance Optimization

1. **Large Datasets**
   - Use pagination in classification table
   - Apply filters to reduce dataset size
   - Consider period filtering for historical data

2. **Slow Analysis**
   - Reduce comment count for initial testing
   - Use manual text input for quick tests
   - Check network latency to Meta API

## Security Considerations

1. **Input Validation**
   - All user inputs are validated before processing
   - Text is sanitized to prevent XSS attacks
   - URLs are validated before API calls

2. **Data Privacy**
   - Analyses are stored per-user in Firestore
   - Firebase Auth ensures user isolation
   - Sensitive tokens stored in environment variables

3. **API Security**
   - Meta tokens are server-side in Netlify functions
   - Rate limiting implemented
   - Error messages don't expose sensitive data

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Responsive design, full support

## Dependencies

### Frontend
- Chart.js (v4.x): Chart rendering
- Firebase SDK (v9.x): Authentication and Firestore
- html2canvas: PDF generation
- jsPDF: PDF creation

### Backend
- Netlify Functions: Serverless API endpoints
- Meta Graph API: Instagram data fetching
- Firebase Auth: User authentication
- Firebase Firestore: Data persistence

## Future Enhancements

1. **Multi-platform Support**: Add Facebook, Twitter analysis
2. **Real-time Updates**: WebSocket for live comment analysis
3. **Advanced ML**: Support for custom model training
4. **Collaboration**: Share analyses with team members
5. **Alerts**: Automated sentiment alerts and notifications
6. **Trend Analysis**: Long-term trend detection
7. **Export Formats**: CSV, Excel export options
8. **Custom Reports**: Template-based report generation

## Support

For issues or questions:
1. Check this documentation
2. Review DASHBOARD_TESTING_REPORT.md
3. Check browser console for errors
4. Verify environment configuration
5. Contact development team

## Version History

### v1.0 (Current)
- Initial dashboard release
- Meta Graph API integration
- ML-based sentiment classification
- Firebase authentication and storage
- PDF report generation
- Model evaluation metrics
- Analysis history management
- Period comparison
- Word analysis
- Data validation
- State management
