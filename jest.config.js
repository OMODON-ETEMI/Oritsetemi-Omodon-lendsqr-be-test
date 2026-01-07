module.exports = {
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  verbose: true,
  clearMocks: true
};

