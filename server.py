# -*- coding: utf-8 -*-

import os

import plivoxml
from firebase import firebase
from flask import Flask, Response, request, url_for

firebaseClient = firebase.FirebaseApplication(os.getenv('FIREBASE_URL'), None)

# This is the message that Plivo reads when the caller does nothing at all
NO_INPUT_MESSAGE = "Sorry, I didn't catch that. Please hangup and try again later."

app = Flask(__name__)


@app.route('/', methods=['GET'])
def index():
    response = plivoxml.Response()
    response.addSpeak(body='Enter your 10 digit mobile number after beep')

    absolute_action_url = url_for('passcode', _external=True)
    getDigits = plivoxml.GetDigits(action=absolute_action_url, method='POST',
                                   timeout=10, numDigits=10, retries=1, playBeep=True,
                                   validDigits='1234567890')
    response.add(getDigits)
    response.addSpeak(NO_INPUT_MESSAGE)
    return Response(str(response), mimetype='text/xml')


def exit_sequence(msg='We did not receive a valid response. We will hangup now.'):
    response = plivoxml.Response()
    response.addSpeak(msg)
    response.addHangup()
    return Response(str(response), mimetype='text/xml')


@app.route('/passcode', methods=['POST'])
def passcode():
    post_args = request.form

    response = plivoxml.Response()
    phone_number = post_args.get('Digits')
    response.addSpeak(body='Enter your 4 digit TOTP pin after beep')
    absolute_action_url = url_for('authenticate', _external=True, phone_number=str(phone_number))
    getDigits = plivoxml.GetDigits(action=absolute_action_url, method='POST',
                                   timeout=4, numDigits=4, retries=1, playBeep=True,
                                   validDigits='1234567890')

    response.add(getDigits)
    response.addSpeak(NO_INPUT_MESSAGE)
    return Response(str(response), mimetype='text/xml')


@app.route('/authenticate', methods=['POST'])
def authenticate():
    phone_number = request.args.get('phone_number')
    passcode = request.form.get('Digits')

    user = firebaseClient.get('/totp', None, params={
        'number': '+91' + phone_number,
        'passcode': passcode,
    })

    if user is None:
        return exit_sequence('Authentication failed')

    response = plivoxml.Response()
    response.addSpeak(body='Use keys 1-9 for speed dial. Press * for last dialed number.')
    absolute_action_url = url_for('main_menu', _external=True, phone_number=str(phone_number))
    getDigits = plivoxml.GetDigits(action=absolute_action_url, method='POST',
                                   timeout=5, numDigits=1, retries=3, validDigits='123456789*')

    response.add(getDigits)
    response.addSpeak(NO_INPUT_MESSAGE)
    return Response(str(response), mimetype='text/xml')


@app.route('/main_menu', methods=['POST'])
def main_menu():
    phone_number = request.args.get('phone_number')
    option = request.form.get('Digits')

    to_call = firebaseClient.get('/speed_dials', None, params={
        'user_number': '+91' + phone_number,
        'key_choice': option,
    })

    if to_call is None:
        return exit_sequence('No number exists to call')

    to_call = to_call.values()[0]

    response = plivoxml.Response()
    response.addSpeak('Connecting %s' % to_call['name'])
    params = {'callerId': phone_number}
    d = response.addDial(**params)

    if to_call['number'].startswith('+91'):
        d.addNumber(to_call['number'])
    else:
        d.addNumber('+91' + to_call['number'])

    return Response(str(response), mimetype='text/xml')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
