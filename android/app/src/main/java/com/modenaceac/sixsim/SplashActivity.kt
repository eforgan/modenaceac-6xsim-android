package com.modenaceac.sixsim

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

/**
 * MODENACEAC 6XSIM — Splash Screen Activity
 * Muestra el splash durante 1.8s y luego lanza MainActivity.
 * Registrada en AndroidManifest.xml con SplashTheme.
 */
@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // El fondo es el drawable splash_screen definido en SplashTheme
        // No hace falta setContentView — el tema ya muestra el splash

        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            // Transición suave: fade in de MainActivity
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }, SPLASH_DURATION_MS)
    }

    companion object {
        private const val SPLASH_DURATION_MS = 1800L
    }
}
