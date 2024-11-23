use std::env;

fn main() {
    // Get command-line arguments
    let args: Vec<String> = env::args().collect();

    // Check if the number of iterations is provided
    if args.len() < 2 {
        eprintln!("Usage: algorithm.exe <iterations>");
        return;
    }

    // Parse the number of iterations
    let iterations: usize = match args[1].parse() {
        Ok(n) => n,
        Err(_) => {
            eprintln!("Please provide a valid number for iterations.");
            return;
        }
    };

    // Run the loop
    run_iterations(iterations);
}

fn run_iterations(iterations: usize) {
    for i in 1..=iterations {
        println!("Iteration {}: Hello, world!", i);
    }
}
