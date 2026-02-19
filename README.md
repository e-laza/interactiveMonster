# Interactive Monster

An interactive SVG monster with eye-tracking effects that follow your cursor or pointer movement.

## Features

- Real-time eye tracking that follows mouse/pointer movement
- Smooth animation with easing
- Responsive design that works on various screen sizes
- Support for both inline SVG and external SVG files
- Touch-friendly (uses pointer events)
- Performant with RequestAnimationFrame

## Getting Started

### Prerequisites

- A modern web browser with JavaScript enabled
- (Optional) Node.js for development tools

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd interactiveMonster
```

2. Install development dependencies (optional):
```bash
npm install
```

### Usage

Simply open `monster.html` in your web browser, or serve the files using a local server:

```bash
npm run serve
```

Then navigate to `http://localhost:3000` in your browser.

## Development

### Available Scripts

- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Automatically fix linting errors
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check if code is properly formatted
- `npm run serve` - Start a local development server

### Code Style

This project uses:
- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **EditorConfig** for consistent editor settings

Run `npm run format && npm run lint:fix` before committing changes.

## File Structure

```
interactiveMonster/
├── monster.html      # Main HTML file
├── monster.css       # Styles
├── monster.js        # Eye tracking logic
├── monster.svg       # SVG monster graphic
├── package.json      # Project dependencies
├── .eslintrc.json    # ESLint configuration
├── .prettierrc.json  # Prettier configuration
├── .editorconfig     # Editor configuration
└── .gitignore        # Git ignore rules
```

## How It Works

The eye tracking system:

1. Identifies all eye iris elements in the SVG (elements with IDs starting with `EYE_IRIS_`)
2. Calculates movement boundaries based on the clip-path constraints
3. Tracks pointer movement and converts to normalized coordinates (-1 to 1)
4. Smoothly animates iris positions using easing
5. Recalculates boundaries on window resize

## Browser Support

Works on all modern browsers that support:
- ES6+ JavaScript
- SVG
- RequestAnimationFrame
- Pointer Events

## License

MIT

## Contributing

Contributions are welcome! Please ensure your code:
- Passes all linting checks
- Is properly formatted
- Includes appropriate comments
- Maintains the existing code style
