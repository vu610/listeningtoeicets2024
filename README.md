# TOEIC Dictation App

A React-based web application for practicing TOEIC listening skills through dictation exercises.

## Features

- **Interactive Audio Player**: Play, pause, and control audio playback
- **Multiple Test Sets**: 10 different TOEIC listening tests
- **Smart Input Validation**: Real-time feedback on typed answers
- **Progress Tracking**: Track your performance across different tests
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Controls.jsx     # Audio playback controls
│   ├── FeedbackDisplay.jsx  # Answer feedback display
│   ├── InputBox.jsx     # Text input component
│   ├── InteractiveInput.jsx # Interactive input with validation
│   ├── Sidebar.jsx      # Navigation sidebar
│   ├── TestSelector.jsx # Test selection component
│   └── TranscriptDisplay.jsx # Transcript display
├── data/               # Test data and audio content
│   ├── t1.json - t10.json  # Test questions and answers
│   └── testsIndex.js   # Test metadata
├── hooks/              # Custom React hooks
│   └── useAudioPlayer.js   # Audio player functionality
├── pages/              # Main application pages
│   ├── HomePage.jsx    # Landing page
│   └── PracticePage.jsx    # Practice interface
└── utils/              # Utility functions
    └── compareInput.js # Input comparison logic
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vu610/listeningtoeicets2024.git
cd listeningtoeicets2024
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Build for Production

```bash
npm run build
```

## How to Use

1. **Select a Test**: Choose from 10 available TOEIC listening tests
2. **Listen**: Play the audio and listen carefully
3. **Type**: Type what you hear in the input field
4. **Get Feedback**: See real-time feedback on your answers
5. **Review**: Check your performance and improve

## Audio Files

The app includes 10 TOEIC listening test audio files (Test_01.mp3 to Test_10.mp3) located in the `public/audio/` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for educational purposes.

## Contact

- GitHub: [@vu610](https://github.com/vu610)
- Email: kmtht12345@gmail.com
