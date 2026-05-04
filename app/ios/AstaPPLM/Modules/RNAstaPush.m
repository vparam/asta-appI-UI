#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNAstaPush, RCTEventEmitter)
RCT_EXTERN_METHOD(registerForRemoteNotifications:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(acknowledgeFromNotification:(NSString *)eventId)
+ (BOOL)requiresMainQueueSetup { return YES; }
@end
