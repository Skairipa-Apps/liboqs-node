#include <napi.h>
#include "oqs_cpp.hpp"

Napi::Value GetEnabledAlgorithmsWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  try {
    auto sigs = oqs::Sigs::get_enabled_sigs();
    Napi::Array result = Napi::Array::New(env, sigs.size());
    for (size_t i = 0; i < sigs.size(); i++) {
      result.Set(i, Napi::String::New(env, sigs[i]));
    }
    return result;
  } catch (const std::exception& e) {
    Napi::TypeError::New(env, e.what()).ThrowAsJavaScriptException();
    return env.Null();
  }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("getEnabledAlgorithms", Napi::Function::New(env, GetEnabledAlgorithmsWrapped));
  return exports;
}

NODE_API_MODULE(oqs_node, Init);

