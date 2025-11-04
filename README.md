# repoiQ Portal

A modern web portal for code repository analysis with LLM integration. This single-page application provides a build-page-like interface for managing code analysis workflows.

## Features

### 🏗️ Build-Page Design
- Clean, professional interface resembling modern CI/CD platforms
- Left sidebar navigation with quick stats
- Right pane with tabbed content
- Responsive design for desktop and mobile

### 📋 Four Main Tabs

#### 1. New Analysis (Submit Tab)
- **GitHub Integration**: Connect to your GitHub account to select repositories
- **Repository Selection**: Choose from your GitHub repositories
- **Branch Configuration**: Specify which branch to analyze
- **Credentials Management**: GitHub Personal Access Token and AWS credentials
- **Directory Filtering**: Skip specific directories from analysis
- **LLM Provider Selection**: Choose between Claude, AWS Bedrock, or Dummy provider

#### 2. Recent Runs (Status Tab)
- **Real-time Status**: Monitor current and recent analysis jobs
- **Progress Tracking**: Visual progress bars for running analyses
- **Status Filtering**: Filter by running, completed, failed, or pending
- **Auto-refresh**: Automatic updates every 30 seconds
- **Quick Actions**: Click any run to view detailed results

#### 3. Archive Tab
- **Historical Data**: View analysis runs older than 2 weeks
- **Date Filtering**: Search by date range
- **Complete History**: Access to all past analyses

#### 4. Analytics Dashboard
- **Repository Metrics**: Select specific repositories or view all
- **Time Period Selection**: 7 days, 30 days, 90 days, or 1 year
- **Key Metrics**:
  - Total analysis runs
  - Token usage statistics
  - Cost tracking
  - Average issues found
- **Visual Charts**: Trend analysis and insights

### 🔄 Navigation Features
- **Back Functionality**: Easy navigation between results and status pages
- **Breadcrumb Navigation**: Clear path indication
- **Tab Switching**: Smooth transitions between different sections
- **Results Detail View**: Comprehensive analysis results with severity indicators

## Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Access to repoIQ backend API (running on localhost:8000 by default)
- GitHub Personal Access Token (for repository integration)

### Installation
1. Clone or download the portal files
2. Ensure the repoIQ backend is running at `http://localhost:8000`
3. Open `index.html` in your web browser
4. No additional setup required - it's a pure HTML/CSS/JavaScript application

### Configuration
- **API Endpoint**: Modify `API_CONFIG.baseURL` in `script.js` if your backend runs on a different port
- **GitHub Integration**: The portal uses Personal Access Tokens for GitHub authentication
- **Styling**: Customize colors and layout in `styles.css`

## Usage Guide

### Getting Started
1. **Open the Portal**: Launch `index.html` in your browser
2. **Connect to GitHub**: Click "Connect to GitHub" and enter your Personal Access Token
3. **Select Repository**: Choose a repository from your GitHub account
4. **Configure Analysis**: Set branch, credentials, and exclusion directories
5. **Start Analysis**: Submit the form to begin code analysis

### Monitoring Progress
1. **Switch to Status Tab**: View all recent analysis runs
2. **Real-time Updates**: Progress bars show completion status
3. **View Results**: Click any completed analysis to see detailed results
4. **Filter Results**: Use status filters to find specific analyses

### Viewing Analytics
1. **Navigate to Analytics Tab**: Access the dashboard
2. **Select Repository**: Choose specific repo or view all
3. **Set Time Period**: Select the analysis timeframe
4. **Review Metrics**: Monitor usage, costs, and trends

## API Integration

The portal integrates with two main APIs:

### GitHub API
- **Authentication**: Personal Access Token
- **Repository Listing**: Fetch user repositories
- **Branch Information**: Get available branches
- **Permissions**: Requires `repo` and `read:user` scopes

### RepoIQ Backend API
- **Repository Management**: Create and list repositories
- **Analysis Control**: Start and monitor analyses
- **Results Retrieval**: Fetch detailed analysis results
- **Status Monitoring**: Real-time progress tracking

## File Structure

```
repoIQEnginePortal/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling and responsive design
├── script.js           # JavaScript functionality and API integration
└── README.md           # This documentation file
```

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Security Considerations

- **Token Storage**: GitHub tokens are stored in memory only (not persisted)
- **HTTPS**: Use HTTPS in production for secure token transmission
- **CORS**: Backend must allow requests from the portal domain
- **Token Permissions**: Use minimal required GitHub token scopes

## Troubleshooting

### Common Issues

1. **GitHub Connection Failed**
   - Verify your Personal Access Token has correct permissions
   - Check token expiration date
   - Ensure token has `repo` and `read:user` scopes

2. **API Connection Issues**
   - Verify repoIQ backend is running on localhost:8000
   - Check browser console for CORS errors
   - Confirm API endpoints are accessible

3. **Repository Not Loading**
   - Check GitHub token permissions
   - Verify repository access rights
   - Try refreshing the connection

4. **Analysis Not Starting**
   - Ensure repository exists in repoIQ backend
   - Check form validation errors
   - Verify all required fields are filled

### Debug Mode
Open browser developer tools (F12) to view console logs and network requests for detailed debugging information.

## Contributing

This portal is designed to work with the repoIQ backend located at `/Users/sgurivireddy/repoIQ`. For modifications:

1. **Frontend Changes**: Edit HTML, CSS, or JavaScript files
2. **API Integration**: Update endpoint URLs in `script.js`
3. **Styling**: Modify `styles.css` for visual changes
4. **Features**: Add new functionality in `script.js`

## License

This project is part of the repoIQ analysis platform.