#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNAstaLiveActivity, NSObject)
RCT_EXTERN_METHOD(start:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(end)
@end
