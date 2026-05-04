// RNAstaHaptics.m — Obj-C bridge that exposes the Swift module to React Native.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNAstaHaptics, NSObject)
RCT_EXTERN_METHOD(trigger:(NSString *)pattern)
@end
