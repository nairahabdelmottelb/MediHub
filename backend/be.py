from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
import os

nltk.download('vader_lexicon')
sia = SentimentIntensityAnalyzer()

app = Flask(__name__)

# Configure PostgreSQL Database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/hospital_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_secret_key'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # doctor, patient, manager
    password = db.Column(db.String(128), nullable=False)

@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], role=data['role'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity={'id': user.id, 'role': user.role})
        return jsonify({'access_token': access_token})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/update_user', methods=['PUT'])
@jwt_required()
def update_user():
    user_identity = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(user_identity['id'])
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if 'username' in data:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        user.username = data['username']
    if 'password' in data:
        user.password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    db.session.commit()
    return jsonify({'message': 'User details updated successfully'})

@app.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    user = get_jwt_identity()
    data = request.get_json()
    message = data['message']
    
    if user['role'] == 'doctor':
        response = "Hello Doctor, how can I assist you with patient care?"
    elif user['role'] == 'patient':
        response = "Hello Patient, I can help with appointments, prescriptions, and more."
    elif user['role'] == 'manager':
        response = "Hello Manager, how can I assist with hospital operations?"
    else:
        response = "I'm not sure how to assist you."
    
    return jsonify({'response': response})

@app.route('/satisfaction', methods=['POST'])
@jwt_required()
def satisfaction():
    data = request.get_json()
    feedback = data['feedback']
    score = sia.polarity_scores(feedback)
    sentiment = "Positive" if score['compound'] > 0 else "Negative" if score['compound'] < 0 else "Neutral"
    return jsonify({'sentiment': sentiment, 'score': score})

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({'message': f'Hello User {current_user}, you accessed a protected route!'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)