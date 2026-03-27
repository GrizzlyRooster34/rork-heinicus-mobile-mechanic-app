package com.heinicus.mechanic;

import android.app.Activity;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.graphics.Color;
import android.view.ViewGroup;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.parseColor("#1a1a1a"));
        layout.setPadding(50, 100, 50, 50);
        
        TextView title = new TextView(this);
        title.setText("🔧 Heinicus Mobile Mechanic");
        title.setTextSize(24);
        title.setTextColor(Color.WHITE);
        title.setPadding(0, 0, 0, 30);
        
        TextView subtitle = new TextView(this);
        subtitle.setText("Professional Mobile Mechanic Services");
        subtitle.setTextSize(18);
        subtitle.setTextColor(Color.parseColor("#00BFFF"));
        subtitle.setPadding(0, 0, 0, 40);
        
        TextView message = new TextView(this);
        message.setText("This is a basic test build of the Heinicus Mobile Mechanic app.\n\nFeatures coming soon:\n• Service booking\n• Real-time tracking\n• Payment processing\n• Mechanic verification\n\nIf you can see this message, the Android build system is working correctly!");
        message.setTextSize(16);
        message.setTextColor(Color.parseColor("#E0E0E0"));
        message.setLineSpacing(1.2f, 1.0f);
        
        layout.addView(title);
        layout.addView(subtitle);
        layout.addView(message);
        
        setContentView(layout);
    }
}
