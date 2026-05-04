// RNAstaPackage.kt — registers all native modules with React Native.
// Add to MainApplication.kt's getPackages() list.

package com.astapplm.modules

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class RNAstaPackage : ReactPackage {

  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = listOf(
    RNAstaHapticsModule(ctx),
    RNAstaBiometricModule(ctx),
    RNAstaPushModule(ctx),
  )

  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
