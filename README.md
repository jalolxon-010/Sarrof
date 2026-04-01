# Sarrof Frontend

Sarrof Frontend is a React-based application for managing debts and credits in both local currency (UZS) and USD.  
The app works together with a backend for authentication and data storage.

Users can log in with a username and password (both must match), then access three main sections: Dashboard, Operations List, and Currency Rate Management.

---

## 🚀 Features

### 1️⃣ Dashboard
- Add new debts or credits
- Three input fields:
  1. Name of the debtor/creditor
  2. Amount in local currency (UZS)
  3. Amount in USD ($)
- Save data to the system
- Overview cards:
  - Total sum in UZS
  - Total sum in USD
  - Combined view (UZS + USD)

### 2️⃣ Operations List
- Displays all saved entries
- Shows date and time (up to minutes)
- Edit or delete any record

### 3️⃣ Currency Rate
- Enter current USD rate
- Dashboard calculations automatically update according to entered rate

---

## 🛠 Tech Stack

**Frontend:**  
- React  
- JavaScript (ES6+)  
- CSS / Tailwind  

**Backend:**  
- Node.js + Express (authentication + data handling)

---

## ⚙️ Installation

### 1. Clone repository

```bash
git clone https://github.com/jalolxon-010/Sarrof.git
cd Sarrof
