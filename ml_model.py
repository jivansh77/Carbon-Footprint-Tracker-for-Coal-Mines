import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
import pickle
import streamlit as st

# Load data and train model
data = pd.read_csv('mine_data3.csv')

# Process strategy_label if it contains multiple labels
data['strategy_label'] = data['strategy_label'].apply(lambda x: x.split(','))

# Convert strategy_label to a format suitable for MultiOutputClassifier
y = pd.get_dummies(data['strategy_label'].apply(pd.Series).stack()).groupby(level=0).sum()

X = data[['coalQty', 'elecConsump', 'transportation', 'deforestedArea']]

# Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a MultiOutputClassifier with class balancing
model = MultiOutputClassifier(RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'))
model.fit(X_train, y_train)

# Save model to file
with open('ml_model.pkl', 'wb') as model_file:
    pickle.dump(model, model_file)

# Load model from file
def load_model():
    with open('ml_model.pkl', 'rb') as model_file:
        return pickle.load(model_file)

def predict_strategy(coalQty, elecConsump, transportation, deforestedArea, threshold=0.18):
    model = load_model()
    
    # Prepare input data
    input_data = pd.DataFrame({
        'coalQty': [coalQty],
        'elecConsump': [elecConsump],
        'transportation': [transportation],
        'deforestedArea': [deforestedArea]
    })

    # Get probabilities for each output label from MultiOutputClassifier
    probas = model.predict_proba(input_data)

    # Convert probabilities into binary predictions with dynamic thresholding
    predictions = []
    
    for prob_list in probas:
        binary_predictions = []
        for prob in prob_list:
            # If the prob array has two elements, access the second element (prob[1])
            # Otherwise, just append 0 or 1 based on the first value
            if len(prob) > 1:
                binary_predictions.append(1 if prob[1] > threshold else 0)
            else:
                binary_predictions.append(1 if prob[0] > threshold else 0)
        predictions.append(binary_predictions)

    # Flatten predictions into a single list
    predictions = [item for sublist in predictions for item in sublist]

    # Map binary predictions to strategy labels
    strategy_map = {
        'Switch to renewables': [ 
            "Suggestion 1: Install solar panels on your premises to harness solar energy.",
            "Suggestion 2: Invest in wind energy by installing wind turbines if feasible.",
            "Suggestion 3: Explore geothermal energy options for heating and cooling.",
            "Suggestion 4: Purchase green energy from renewable sources through your energy supplier."
        ],
        'Adopt electric vehicles': [ 
            "Suggestion 1: Replace your gasoline or diesel vehicles with electric vehicles (EVs).",
            "Suggestion 2: Install EV charging stations at your facility or home.",
            "Suggestion 3: Encourage the use of public transportation or carpooling to reduce reliance on personal vehicles.",
            "Suggestion 4: Explore incentives and rebates for purchasing electric vehicles."
        ],
        'Afforestation': [  
            "Suggestion 1: Participate in local tree planting initiatives and support reforestation projects.",
            "Suggestion 2: Partner with organizations focused on forest conservation and management.",
            "Suggestion 3: Encourage the use of sustainable land management practices to prevent deforestation.",
            "Suggestion 4: Support policies and programs that promote the growth of urban green spaces."
        ],
        'Implement methane capture': [  
            "Suggestion 1: Install methane capture systems at landfills to collect and utilize methane gas.",
            "Suggestion 2: Implement anaerobic digesters in agricultural operations to capture methane from organic waste.",
            "Suggestion 3: Use captured methane as a renewable energy source for heating or electricity generation.",
            "Suggestion 4: Support and invest in technologies that improve the efficiency of methane capture and utilization."
        ],
        'Estimate Carbon Credits': [ 
            "Suggestion 1: Calculate your carbon footprint to understand the amount of carbon credits you need.",
            "Suggestion 2: Invest in certified carbon offset projects such as renewable energy or reforestation initiatives.",
            "Suggestion 3: Monitor and verify the performance of carbon offset projects to ensure they meet standards.",
            "Suggestion 4: Explore opportunities to generate your own carbon credits through sustainability projects."
        ],
        'label_6': [  # General Strategies
            "Suggestion 1: Improve energy efficiency across all operations to reduce overall carbon emissions.",
            "Suggestion 2: Implement waste reduction strategies and enhance recycling efforts.",
            "Suggestion 3: Engage with stakeholders to promote sustainability and environmental responsibility.",
            "Suggestion 4: Continuously monitor and report on your environmental impact to track progress and make improvements."
        ]
    }

    # Get the strategy labels based on binary predictions
    active_labels = [label for label, is_active in zip(strategy_map.keys(), predictions) if is_active]

    # Collect suggestions for each active strategy
    suggestions = [strategy_map.get(label, ["No suggestions available for this label."]) for label in active_labels]

    return {
        "strategy_labels": active_labels,
        "suggestions": suggestions
    }

# Streamlit app configuration
st.set_page_config(page_title="Carbon Footprint Suggestions", layout="centered")

# Main Title
st.markdown("<h1 style='text-align: center; color: #f39c12;'>Personalized Suggestions to Offset Your Carbon Footprint</h1>", unsafe_allow_html=True)

st.write("Based on your input, here are some tailored strategies to help you reduce your carbon footprint:")

# Function to safely convert strings to floats, handling invalid inputs
def safe_float_conversion(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

# Access query parameters using the updated method
params = st.query_params

# Extract query parameters or default to empty string
coalQty = safe_float_conversion(params.get('coalQty', ''))
elecConsump = safe_float_conversion(params.get('elecConsump', ''))
transportation = safe_float_conversion(params.get('transportation', ''))
deforestedArea = safe_float_conversion(params.get('deforestedArea', ''))

# Check if all inputs are valid numbers (i.e., not None)
if None not in [coalQty, elecConsump, transportation, deforestedArea]:
    # If all inputs are valid, proceed with prediction
    with st.container():
        st.subheader("Tailored Suggestions:")

        # Display suggestions
        result = predict_strategy(coalQty, elecConsump, transportation, deforestedArea)
        st.write(f"**Strategy Labels:** {', '.join(result['strategy_labels'])}")

        # Show the list of suggestions
        for label, suggestions in zip(result['strategy_labels'], result['suggestions']):
            st.write(f"**For {label}:**")
            for suggestion in suggestions:
                st.write(f"- {suggestion}")

else:
    st.error("Invalid input values. Please enter valid numbers.")

# Recommendations section
with st.container():
    st.subheader("Further Recommendations")
    st.write("Explore more options for reducing your carbon footprint:")
    st.write("- [Adopt Renewable Energy Solutions](#)")
    st.write("- [Join Carbon Offset Programs](#)")
    st.write("- [Implement Energy-Efficient Practices](#)")

# Add a button to go back to the specified URL
st.markdown(
    """
    <div style="text-align: center; margin-top: 20px;">
        <a href="http://localhost:3000/calculate">
            <button style="background-color: #f39c12; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; cursor: pointer;">
                Calculate Again
            </button>
        </a>
    </div>
    """,
    unsafe_allow_html=True
)
