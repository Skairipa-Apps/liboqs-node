{
  "targets": [
    {
      "target_name": "liboqs_node",
      "sources": [
        "src/addon.cpp",
        "src/KEMs.cpp",
        "src/KeyEncapsulation.cpp",
        "src/Random.cpp",
        "src/Signature.cpp",
        "src/Sigs.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "./deps/liboqs/build/include",
        "./deps/liboqs-cpp/include"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "NAPI_VERSION=6",
        "LIBOQS_CPP_VERSION=\"0.7.1\""
      ],
      "conditions": [
        # Prebuild script for Linux and macOS
        [ "OS!='win'", {
          "actions": [
            {
              "action_name": "prebuild",
              "inputs": [],
              "outputs": [],
              "action": ["npx", "npm", "run", "prebuild"],
              "message": "Running prebuild script for Unix"
            }
          ]
        }],
        # Prebuild script for Windows
        [ "OS=='win'", {
          "actions": [
            {
              "action_name": "prebuild_win",
              "inputs": [],
              "outputs": [],
              "action": ["npx.cmd", "npm", "run", "prebuild"],
              "message": "Running prebuild script for Windows"
            }
          ]
        }],
        # Linux-specific compile flags
        [ "OS=='linux'", {
          "cflags": ["-fexceptions", "-std=c++2a"],
          "cflags_cc": ["-fexceptions", "-std=c++2a"],
          "libraries": [
            "-L../deps/liboqs/build/lib",
            "-loqs"
          ]
        }],
        # macOS-specific settings
        [ "OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++"
          },
          "cflags": ["-fexceptions", "-std=c++2a"],
          "cflags_cc": ["-fexceptions", "-std=c++2a"],
          "libraries": [
            "../deps/liboqs/build/lib/liboqs.a"
          ]
        }],
        # Windows-specific settings
        [ "OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": ["/std:c++20"]
            }
          },
          "libraries": [
            "deps\\liboqs\\build\\lib\\oqs.lib"
          ]
        }]
      ],
      "module_path": "lib/binding/{platform}-{arch}/"
    }
  ]
}

