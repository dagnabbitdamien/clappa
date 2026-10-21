#pragma once
#include <stdbool.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
bool clappa_quicknet_verify(const uint8_t digest[32],const uint8_t signature[48]);
#ifdef __cplusplus
}
#endif
