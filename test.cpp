#include <iostream>
#include "oqs_cpp.hpp"

int main() {
    std::cout << "Calling oqs::Sigs::get_enabled_sigs()..." << std::endl;

    try {
        auto sigs = oqs::Sigs::get_enabled_sigs();
        std::cout << "Got " << sigs.size() << " signature algorithms:" << std::endl;
        for (const auto& sig : sigs) {
            std::cout << " - " << sig << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
    }

    return 0;
}

