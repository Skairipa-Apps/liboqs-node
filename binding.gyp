{
  "targets": [
    {
      "target_name": "liboqs_node",
      "sources": [
        "./src/addon.cpp",
        "./src/KEMs.cpp",
        "./src/KeyEncapsulation.cpp",
        "./src/Random.cpp",
        "./src/Signature.cpp",
        "./src/Sigs.cpp"
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
      "actions": [
        {
          "action_name": "prebuild",
          "inputs": [],
          "outputs": [""],
          "action": [
            "<!(node -p 'process.execPath')",
            "<!(node -p 'require.resolve(\"npm/bin/npm-cli.js\")')",
            "run",
            "prebuild"
          ],
          "message": "Executing prebuild script"
        }
      ],
      "conditions": [
        // Linux
        ["OS=='linux'", {
          "cflags": ["-fexceptions", "-std=c++2a"],
          "cflags_cc": ["-fexceptions", "-std=c++2a"],
          "libraries": [
            "-L../deps/liboqs/build/lib",
            "-loqs"
          ]
        }],
        // macOS
        ["OS=='mac'", {
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
        // Windows
        ["OS=='win'", {
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
      "module_path": "./lib/binding/{platform}-{arch}/"
    }
  ]
}

