
const API_KEY = "AIzaSyDfdcQj7Qh5yjQHpcY52Vn-GuEHCwjjjJs";

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(model => {
        if (model.name.includes("flash")) {
            console.log(model.name);
        }
      });
    } else {
      console.log("No models found or error:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
