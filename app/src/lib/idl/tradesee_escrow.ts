import { PublicKey } from '@solana/web3.js';

export type TradeseeEscrow = {
  "address": "8BSkiLQxn9WoMWoYWSNW2bmFdYZ2QMFFMiMWParsixax",
  "metadata": {
    "name": "tradesee_escrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "anchor_trust_score",
      "docs": [
        "Anchor a trust score (Step 2 stub)"
      ],
      "discriminator": [
        237,
        243,
        76,
        182,
        214,
        134,
        239,
        172
      ],
      "accounts": [
        {
          "name": "trust_score",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  117,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "counterparty"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "counterparty"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "counterparty",
          "type": "pubkey"
        },
        {
          "name": "score",
          "type": "u16"
        }
      ]
    },
    {
      "name": "deposit_payin",
      "docs": [
        "Deposit USDC into the escrow"
      ],
      "discriminator": [
        93,
        24,
        145,
        135,
        152,
        150,
        125,
        42
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.initializer",
                "account": "Contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "Contract"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyer_token_account",
          "writable": true
        },
        {
          "name": "escrow_vault",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize_contract",
      "docs": [
        "Initialize a new escrow contract"
      ],
      "discriminator": [
        181,
        192,
        35,
        141,
        212,
        113,
        138,
        94
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "initializer"
              },
              {
                "kind": "arg",
                "path": "contract_id"
              }
            ]
          }
        },
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "usdc_mint"
        },
        {
          "name": "escrow_vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contract_id",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "seller",
          "type": "pubkey"
        },
        {
          "name": "amount_expected",
          "type": "u64"
        },
        {
          "name": "milestones_total",
          "type": "u8"
        },
        {
          "name": "expiry_ts",
          "type": "i64"
        },
        {
          "name": "auto_release_on_expiry",
          "type": "bool"
        },
        {
          "name": "doc_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "refund",
      "docs": [
        "Refund funds to buyer"
      ],
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.initializer",
                "account": "Contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "Contract"
              }
            ]
          }
        },
        {
          "name": "buyer_token_account",
          "writable": true
        },
        {
          "name": "escrow_vault",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "release_payout",
      "docs": [
        "Release funds to seller"
      ],
      "discriminator": [
        181,
        87,
        198,
        92,
        64,
        3,
        24,
        155
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.initializer",
                "account": "Contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "Contract"
              }
            ]
          }
        },
        {
          "name": "seller_token_account",
          "writable": true
        },
        {
          "name": "escrow_vault",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "set_oracle_result",
      "docs": [
        "Set oracle result (Step 3 stub)"
      ],
      "discriminator": [
        36,
        59,
        3,
        2,
        173,
        104,
        208,
        111
      ],
      "accounts": [
        {
          "name": "contract",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  97,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "contract.initializer",
                "account": "Contract"
              },
              {
                "kind": "account",
                "path": "contract.contract_id",
                "account": "Contract"
              }
            ]
          }
        },
        {
          "name": "oracle_flag",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "contract"
              }
            ]
          }
        },
        {
          "name": "oracle_authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "shipment_verified",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Contract",
      "discriminator": [
        172,
        138,
        115,
        242,
        121,
        67,
        183,
        26
      ]
    },
    {
      "name": "OracleFlag",
      "discriminator": [
        237,
        65,
        9,
        211,
        141,
        143,
        233,
        243
      ]
    },
    {
      "name": "TrustScore",
      "discriminator": [
        243,
        22,
        69,
        106,
        84,
        238,
        239,
        5
      ]
    }
  ],
  "events": [
    {
      "name": "ContractInitialized",
      "discriminator": [
        233,
        69,
        33,
        152,
        208,
        61,
        150,
        192
      ]
    },
    {
      "name": "OracleUpdated",
      "discriminator": [
        138,
        9,
        51,
        219,
        228,
        198,
        11,
        147
      ]
    },
    {
      "name": "PayinDeposited",
      "discriminator": [
        98,
        94,
        147,
        47,
        183,
        37,
        214,
        143
      ]
    },
    {
      "name": "PayoutReleased",
      "discriminator": [
        245,
        195,
        37,
        2,
        200,
        70,
        126,
        210
      ]
    },
    {
      "name": "Refunded",
      "discriminator": [
        35,
        103,
        149,
        246,
        196,
        123,
        221,
        99
      ]
    },
    {
      "name": "TrustScoreAnchored",
      "discriminator": [
        150,
        184,
        157,
        126,
        38,
        150,
        209,
        146
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAuthority",
      "msg": "Invalid authority"
    },
    {
      "code": 6001,
      "name": "AmountMismatch",
      "msg": "Amount mismatch"
    },
    {
      "code": 6002,
      "name": "AlreadyReleased",
      "msg": "Already released"
    },
    {
      "code": 6003,
      "name": "AlreadyRefunded",
      "msg": "Already refunded"
    },
    {
      "code": 6004,
      "name": "NotExpired",
      "msg": "Contract not expired"
    },
    {
      "code": 6005,
      "name": "NotEnoughMilestones",
      "msg": "Not enough milestones completed"
    },
    {
      "code": 6006,
      "name": "WrongMint",
      "msg": "Wrong mint"
    },
    {
      "code": 6007,
      "name": "Overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "InvalidScore",
      "msg": "Invalid score (must be 0-1000)"
    },
    {
      "code": 6009,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6010,
      "name": "InvalidMilestones",
      "msg": "Invalid milestones"
    },
    {
      "code": 6011,
      "name": "InvalidExpiry",
      "msg": "Invalid expiry timestamp"
    },
    {
      "code": 6012,
      "name": "ContractExpired",
      "msg": "Contract expired"
    },
    {
      "code": 6013,
      "name": "ReleaseConditionsNotMet",
      "msg": "Release conditions not met"
    },
    {
      "code": 6014,
      "name": "AutoReleaseEnabled",
      "msg": "Auto release is enabled"
    }
  ],
  "types": [
    {
      "name": "Contract",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initializer",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "usdc_mint",
            "type": "pubkey"
          },
          {
            "name": "escrow_vault",
            "type": "pubkey"
          },
          {
            "name": "contract_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount_expected",
            "type": "u64"
          },
          {
            "name": "milestones_total",
            "type": "u8"
          },
          {
            "name": "milestones_completed",
            "type": "u8"
          },
          {
            "name": "auto_release_on_expiry",
            "type": "bool"
          },
          {
            "name": "expiry_ts",
            "type": "i64"
          },
          {
            "name": "doc_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "released",
            "type": "bool"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "updated_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ContractInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contract",
            "type": "pubkey"
          },
          {
            "name": "initializer",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "amount_expected",
            "type": "u64"
          },
          {
            "name": "expiry_ts",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "OracleFlag",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "shipment_verified",
            "type": "bool"
          },
          {
            "name": "updated_by",
            "type": "pubkey"
          },
          {
            "name": "updated_at",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "OracleUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contract",
            "type": "pubkey"
          },
          {
            "name": "shipment_verified",
            "type": "bool"
          },
          {
            "name": "updated_by",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PayinDeposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contract",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PayoutReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contract",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "seller",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "Refunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contract",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "TrustScore",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "counterparty",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u16"
          },
          {
            "name": "updated_at",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "TrustScoreAnchored",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "counterparty",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u16"
          }
        ]
      }
    }
  ]
};
