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
        # Prebuild for Unix
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
        # Prebuild for Windows
        [ "OS=='win'", {
          "actions": [
            {
              "action_name": "prebuild_win",
              "inputs": [],
              "outputs": ["some"],
              "action": [
                #"node",
                "npm run prebuild"
		#"<(module_root_dir)/scripts/run-npm-on-windows.js",
                #"run",
                #"prebuild"
              ],
              "working_dir": "<(module_root_dir)",
              "message": "Running prebuild script for Windows"
            }
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1,
              "AdditionalOptions": ["/std:c++20", "/EHsc", "/DUNICODE"]
            }
          },
          "libraries": [
            "deps\\liboqs\\build\\lib\\oqs.lib"
          ]
        }],
        [ "OS=='linux'", {
          "cflags": ["-fexceptions", "-std=c++20"],
          "cflags_cc": ["-fexceptions", "-std=c++20"],
          "libraries": [
            "-L../deps/liboqs/build/lib",
            "-loqs"
          ]
        }],
        [ "OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++"
          },
          "cflags": ["-fexceptions", "-std=c++20"],
          "cflags_cc": ["-fexceptions", "-std=c++20"],
          "libraries": [
            "../deps/liboqs/build/lib/liboqs.a"
          ]
        }]
      ],
      "module_path": "lib/binding/{platform}-{arch}/"
    }
  ]
}

