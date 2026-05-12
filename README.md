
HCP CRM PRO - AI-Powered Healthcare Portal

An intelligent Healthcare Professional (HCP) Relationship Management system that uses AI to extract structured interaction data from natural language input. The application converts unstructured meeting notes into organized fields such as HCP name, date, and notes.

Developer  
Yogesh P

Features  
- AI-based auto extraction of HCP name, date, and notes  
- FastAPI backend with REST API  
- React frontend with simple user interface  
- Real-time API communication between frontend and backend  
- Structured JSON output from unstructured text  

Tech Stack  

Frontend:  
- React.js  
- JavaScript  
- Fetch API  

Backend:  
- Python  
- FastAPI  
- Uvicorn  

AI:  
- Groq API (Llama / Gemma models)  


Setup Instructions  

Backend Setup  


cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn groq pydantic
uvicorn main:app --reload


Backend will run on:  
http://localhost:8000  

API documentation:  
http://localhost:8000/docs  

Frontend Setup  


cd frontend
npm install
npm start


Frontend will run on:  
http://localhost:3000  

API Endpoint  

POST /chat  

Request  

{
"message": "Met Dr. John on May 12, discussed cancer therapy"
}


Response  


{
"hcp_name": "Dr. John",
"date": "May 12",
"notes": "discussed cancer therapy"
}

Example  

Input  



Meeting with Dr. Priya about hypertension drugs on May 10



Output  
- HCP Name: Dr. Priya  
- Date: May 10  
- Notes: hypertension drugs discussion  

Notes  
- Ensure backend is running before using frontend  
- Check browser console for API errors  
- Keep API keys secure and do not commit them to version control  

Future Improvements  
- Database integration (MySQL or PostgreSQL)  
- Authentication system
- Sentiment analysis  
- State management with Redux  

License  
This project is for educational and portfolio purposes.



