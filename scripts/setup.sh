#!/bin/bash

# Gmail-2-Trello Development Setup Script

echo "🚀 Setting up Gmail-2-Trello development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 14.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version must be >= 14.0.0. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Chrome is installed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo "✅ Chrome is installed"
    else
        echo "⚠️  Chrome not found in /Applications. Please install Chrome."
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v google-chrome &> /dev/null; then
        echo "✅ Chrome is installed"
    else
        echo "⚠️  Chrome not found. Please install Chrome."
    fi
else
    echo "⚠️  Please ensure Chrome is installed on your system."
fi

# Create development directory structure
echo "📁 Setting up directory structure..."
mkdir -p logs
mkdir -p dist

# Set up git hooks if .git exists
if [ -d ".git" ]; then
    echo "🔧 Setting up git hooks..."
    if [ ! -d ".git/hooks" ]; then
        mkdir -p .git/hooks
    fi
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix the issues before committing."
    exit 1
fi
echo "✅ Pre-commit checks passed"
EOF
    
    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' in the top right"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'chrome_manifest_v3' directory from this project"
echo "5. Go to Gmail to test the extension"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev     - Show development instructions"
echo "  npm run build   - Create extension zip file"
echo "  npm run test    - Run tests"
echo "  npm run lint    - Check code style"
echo "  npm run format  - Format code"
echo ""
echo "📚 For more information, see DEVELOPMENT.md" 