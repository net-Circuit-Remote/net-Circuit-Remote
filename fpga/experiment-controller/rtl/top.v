// net*CIRCUIT Remote Experiment Controller
// Initial compile-safe PLACEHOLDER only.
// No SPI, routing, clock-generation, Logic Analyzer, SDRAM, or instrument
// behavior is implemented in this scaffold.

module netcircuit_experiment_top (
    input  wire clk,
    input  wire reset_n,
    output wire status_led
);
    // Placeholder behavior only: expose reset state for basic syntax/build checks.
    assign status_led = reset_n & clk;
endmodule
