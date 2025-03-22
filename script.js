async function callWorker() {
    try {
        const response = await fetch("https://ark-ds.workers.dev/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: "Hello, DeepSeek!"
            }) // Only send the necessary input
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Response from Worker:", result);
    } catch (error) {
        console.error("Error calling Worker:", error);
    }
}

callWorker();
