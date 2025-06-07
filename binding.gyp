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
        "node_modules/node-addon-api",
        "./deps/liboqs/include",
        "./deps/liboqs/build/include",
        "./deps/liboqs-cpp/include"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "NAPI_VERSION=6",
        "LIBOQS_CPP_VERSION=\"1.0.0\""
      ],
      "conditions": [
        [ "OS!='win'", {
          "actions": [
            {
              "action_name": "prebuild",
              "inputs": [],
              "outputs": ["some"],
              "action": ["npm", "run", "prebuild"],
              "message": "Running prebuild script for Unix"
            }
          ]
        }],
        // Windows settings
        [ "OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": [
                "/std:c++20",
                "/EHsc",
                "/DUNICODE"
              ],
              "AdditionalIncludeDirectories": [
                "deps\\liboqs\\include",
                "deps\\liboqs\\build\\include",
                "deps\\liboqs-cpp\\include"
              ]
            }
          },
          "libraries": [
            "deps\\liboqs\\build\\lib\\oqs.lib"
          ],
          "conditions": [
            ["target_arch=='x64'", {
              "defines": ["WIN64"]
            }],
            ["target_arch=='ia32'", {
              "defines": ["WIN32"]
            }]
          ]
        }],

        // Linux dynamic linking (still uses liboqs.so)
        [ "OS=='linux'", {
          "cflags": ["-fexceptions", "-std=c++20"],
          "cflags_cc": ["-fexceptions", "-std=c++20"],
          "libraries": [
            "-L../deps/liboqs/build/lib",
            "-loqs"
          ]
        }],

        // macOS static linking (no dylib, no rpath)
        [ "OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++"
          },
          "cflags": ["-fexceptions", "-std=c++20"],
          "cflags_cc": ["-fexceptions", "-std=c++20"],
          "include_dirs": [
            "./deps/liboqs/include",
            "./deps/liboqs/build/include",
            "./deps/liboqs-cpp/include",
            "/opt/homebrew/opt/openssl@3/include"
          ],
          "libraries": [
            "<!(pwd)/deps/liboqs/build/lib/liboqs.a", // absolute path to ensure static
            "-L/opt/homebrew/opt/openssl@3/lib",
            "-lcrypto",
            "-lssl"
          ]
        }]
      ],
      "module_path": "lib/binding/{platform}-{arch}/"
    }
  ]
}

