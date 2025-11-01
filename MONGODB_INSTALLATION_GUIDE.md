# 📘 MongoDB Installation Guide - Windows

## Step-by-Step Instructions

### **Step 1: Download MongoDB Community Server**

1. **Open your web browser** and go to:
   ```
   https://www.mongodb.com/try/download/community
   ```

2. **Select the settings:**
   - **Version**: Choose the latest stable version (e.g., 7.0.x or 8.0.x)
   - **Platform**: Select **Windows**
   - **Package**: Select **MSI** (installer file)
   - **Click "Download"**

3. **Wait for the download to complete** (file size is around 200-300 MB)

---

### **Step 2: Install MongoDB**

1. **Locate the downloaded file** (usually in your Downloads folder)
   - File name will be something like: `mongodb-windows-x86_64-7.0.x-signed.msi`

2. **Double-click the .msi file** to start the installer

3. **Follow the installation wizard:**

   a. **Welcome Screen**: Click "Next"
   
   b. **End-User License Agreement**: 
      - Check "I accept the terms in the License Agreement"
      - Click "Next"
   
   c. **Choose Setup Type**:
      - Select **"Complete"** (recommended) or "Custom"
      - Click "Next"
   
   d. **Service Configuration**:
      - Check **"Install MongoDB as a Service"** ✅
      - Service Name: `MongoDB` (default)
      - Service runs as: **"Network Service user"** (default)
      - Check **"Run service as Network Service user"** ✅
      - Click "Next"
   
   e. **Install MongoDB Compass** (Optional):
      - MongoDB Compass is a GUI tool (optional but helpful)
      - You can check or uncheck this box
      - Click "Next"
   
   f. **Ready to Install**:
      - Review your selections
      - Click "Install"
   
   g. **Installation Progress**:
      - Wait for the installation to complete (2-5 minutes)
      - Click "Finish" when done

---

### **Step 3: Verify MongoDB Installation**

1. **Check if MongoDB service is running:**

   **Method A: Using Services (Easiest)**
   - Press `Windows Key + R`
   - Type: `services.msc`
   - Press Enter
   - Look for **"MongoDB Server (MongoDB)"** in the list
   - Check if the **Status** is **"Running"**
   - If it says "Stopped", right-click and select "Start"

   **Method B: Using Command Prompt**
   - Press `Windows Key + X` and select "Windows PowerShell (Admin)" or "Command Prompt (Admin)"
   - Type:
     ```powershell
     sc query MongoDB
     ```
   - Look for `STATE` - it should say `RUNNING`

2. **Test MongoDB connection:**
   - Open a new Command Prompt or PowerShell (you don't need admin rights for this)
   - Type:
     ```powershell
     mongosh
     ```
   - If you see `>` prompt, MongoDB is working!
   - Type `exit` to leave MongoDB shell

---

### **Step 4: Configure MongoDB (If needed)**

1. **If MongoDB service is not running:**
   - Open **Services** (Windows Key + R → `services.msc`)
   - Find **"MongoDB Server (MongoDB)"**
   - Right-click → **"Start"**

2. **Set MongoDB to start automatically:**
   - In Services, right-click **"MongoDB Server (MongoDB)"**
   - Select **"Properties"**
   - Set **Startup type** to **"Automatic"**
   - Click **"OK"**

---

### **Step 5: Run Your Smart Event Ticket System**

1. **Open PowerShell or Command Prompt**

2. **Navigate to your project directory:**
   ```powershell
   cd E:\Smart-Online-Event-Ticket-System
   ```

3. **Verify MongoDB is accessible:**
   ```powershell
   mongosh --eval "db.version()"
   ```
   - You should see a version number (e.g., 7.0.5)
   - If you see an error, MongoDB might not be running

4. **Start your system:**
   ```powershell
   node start-simple.js
   ```

5. **Wait for both servers to start:**
   - Backend will start on port 5000
   - Frontend will start on port 3000 (takes 30-60 seconds)

6. **You should see:**
   ```
   ✅ System startup initiated!
   📊 Backend: http://localhost:5000
   🌐 Frontend: http://localhost:3000
   MongoDB connected successfully
   ```

---

### **Step 6: Access Your System**

1. **Open your web browser**

2. **Go to:** `http://localhost:3000`

3. **You should see your Smart Event Ticket Booking System!** 🎉

---

## 🛠️ Troubleshooting

### **Problem: MongoDB service won't start**

**Solution 1: Check if port 27017 is in use**
```powershell
netstat -ano | findstr :27017
```
If something is using it, you may need to stop that process.

**Solution 2: Manually start MongoDB**
```powershell
# As Administrator
net start MongoDB
```

**Solution 3: Check MongoDB logs**
- Location: `C:\Program Files\MongoDB\Server\[version]\log\mongod.log`
- Look for error messages

### **Problem: "mongosh" command not found**

**Solution:** MongoDB Shell might not be in your PATH
- Try: `C:\Program Files\MongoDB\Server\[version]\bin\mongosh.exe`
- Or reinstall MongoDB and make sure "Install MongoDB Shell" is checked

### **Problem: System shows "MongoDB connection error"**

**Checklist:**
1. ✅ Is MongoDB service running? (Check Services)
2. ✅ Is port 27017 available?
3. ✅ Can you connect with `mongosh`?
4. ✅ Try restarting MongoDB service

### **Problem: Frontend won't start**

**Solution:** Make sure you're in the project root and try:
```powershell
cd client
npm install
npm start
```

---

## ✅ Quick Verification Commands

```powershell
# Check if MongoDB is running
sc query MongoDB

# Check MongoDB version
mongosh --version

# Connect to MongoDB
mongosh

# Check if MongoDB is listening on port 27017
netstat -ano | findstr :27017

# Start MongoDB service (Admin required)
net start MongoDB

# Stop MongoDB service (Admin required)
net stop MongoDB
```

---

## 🎯 Summary

1. ✅ Download MongoDB from official website
2. ✅ Install using the MSI installer
3. ✅ Verify MongoDB service is running
4. ✅ Test connection with `mongosh`
5. ✅ Run `node start-simple.js` in your project
6. ✅ Access system at http://localhost:3000

**That's it! Your system is ready to use!** 🚀

---

## 📞 Need Help?

If you encounter any issues:
1. Check the MongoDB logs
2. Verify the service is running
3. Make sure port 27017 is not blocked
4. Try restarting your computer (this often fixes service issues)
