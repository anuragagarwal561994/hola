package com.google.firebase.quickstart.auth;


import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import static com.google.firebase.quickstart.auth.PhoneAuthActivity.PREFS_NAME;


class SpeedDial {
    public String key_choice;
    public String name;
    public String number;
    public String user_number;
    public String key;

    public SpeedDial() {
    }

    public SpeedDial(String key_choice, String name, String number, String user_number, String key) {
        this.key_choice = key_choice;
        this.name = name;
        this.number = number;

        if (user_number.startsWith("+91")) {
            this.user_number = user_number.replace("+91", "");
        } else {
            this.user_number = user_number;
        }

        this.key = key;
    }
}

public class CallReceiver extends BroadcastReceiver {
    private DatabaseReference mDatabase;

    private void insertSpeedDial(String number, String userNumber, String userId, String lastDialedKey, SharedPreferences.Editor editor) {
        if (number.equals("+18886668310")) {
            return;
        }

        SpeedDial speedDial = new SpeedDial("*", "Last Dialed", number, userNumber, userId);

        if (lastDialedKey == null) {
            lastDialedKey = mDatabase.child("last_called").push().getKey();
            editor.putString("last_dialed_key", lastDialedKey);
            editor.apply();
        }

        mDatabase.child("speed_dials").child(lastDialedKey).setValue(speedDial);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences settings = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String userId = settings.getString("user_uuid", null);
        String userNumber = settings.getString("user_number", null);
        String lastDialedKey = settings.getString("last_dialed_key", null);

        SharedPreferences.Editor editor = settings.edit();

        if (userId == null) {
            return;
        }

        mDatabase = FirebaseDatabase.getInstance().getReference();
        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);

        if (state == null) {
            String outgoingNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
            this.insertSpeedDial(outgoingNumber, userNumber, userId, lastDialedKey, editor);
        } else if (state.equals(TelephonyManager.EXTRA_STATE_RINGING)) {
            // Phone number
            String incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
            this.insertSpeedDial(incomingNumber, userNumber, userId, lastDialedKey, editor);
        }
    }
}
