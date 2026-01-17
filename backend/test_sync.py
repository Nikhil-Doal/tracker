from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/events/sync', methods=['POST'])
def test_sync():
    data = request.json
    print("\n" + "="*50)
    print("RECEIVED DATA:")
    print("="*50)
    print(f"Type: {type(data)}")
    print(f"Keys: {data.keys() if data else 'None'}")
    
    if data and 'events' in data:
        events = data['events']
        print(f"\nNumber of events: {len(events)}")
        if events:
            print(f"\nFirst event:")
            print(events[0])
    
    print("="*50 + "\n")
    
    return jsonify({'received': True}), 200

if __name__ == '__main__':
    app.run(port=5001, debug=True)