import { execSync } from "child_process"

try {
  console.log("Installing Firebase...")
  const output = execSync("npm install firebase", { encoding: "utf-8" })
  console.log(output)
  console.log("Firebase installed successfully!")
} catch (error) {
  console.error("Error installing Firebase:", error.message)
}

