package com.modenaceac.sixsim

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * MODENACEAC 6XSIM — MainActivity
 * Tablet Android 10" · Orientación vertical bloqueada
 */
class MainActivity : ReactActivity() {

    /** Nombre del componente registrado en index.js */
    override fun getMainComponentName(): String = "MODENACEAC6XSIM"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
