import  app  from "./app.js";

// Ensure that the port is defined
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not set in .env

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
