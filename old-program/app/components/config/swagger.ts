import swaggerJsDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Metal Calculator API",
      version: "1.0.0",
      description: "API documentation for the Metal Calculator API",
    },
    servers: [{ url: "http://localhost:3000" }], // Change if deployed
  },
  apis: ["./app/routes/api_*.ts"], // Adjust to match your API route structure
};

const swaggerSpec = swaggerJsDoc(options);

export default swaggerSpec;
