// jest.config.js
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/db/**"],
  coverageReporters: ["text", "cobertura", "lcov"],
  coverageDirectory: "coverage",
  // Output JUnit XML for Jenkins test results publishing
  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "coverage",
      outputName:      "junit.xml",
    }],
  ],
};
