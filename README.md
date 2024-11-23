# TUManyCars Project

This project contains both a web application (Node.js) and a Rust algorithm component.

## Setup Instructions for Windows

### Prerequisites

1. Install Node.js: Download and install from https://nodejs.org/
2. Install Rust:
   - Visit https://rustup.rs/
   - Download `rustup-init.exe`
3. Install vscode extension: rust-analyzer
4. Install vscode extension: [C/C++](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   following must be checked:
   - "Desktop development with C++"
     - "MSVC v143 - VS 2022 C++ x64/x86 build tools"
     - "Windows 10/11 SDK"

### Verify Installations

Open a new Command Prompt or PowerShell window and run:

```powershell
node --version
npm --version
rustc --version
cargo --version
```

### Running the Web Application

```powershell
# From the root directory
npm run dev
```

### Building/Running the Rust Algorithm

```powershell
# From the root directory
cargo build        # Build all Rust components
cargo run -p algorithm  # Run the algorithm specifically
```

## Project Structure

- `web/`: Web application
- `algorithm/`: Rust algorithm implementation
- `Cargo.toml`: Rust workspace configuration

## Troubleshooting

- If commands are not recognized after installation, close and reopen your Command Prompt/PowerShell
- Make sure you have admin rights when installing Rust/Node.js
- If you see any path-related errors, try restarting your computer after installation
