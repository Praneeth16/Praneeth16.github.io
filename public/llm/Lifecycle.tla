---------------------------- MODULE Lifecycle ----------------------------
EXTENDS Naturals
VARIABLES phase, version, releaseVersion, checked, released, context, cached
vars == <<phase, version, releaseVersion, checked, released, context, cached>>
Init == /\ phase = "raw" /\ version = 0 /\ releaseVersion = 0
        /\ checked = FALSE /\ released = FALSE /\ context = 0 /\ cached = 0
Curate == /\ phase = "raw" /\ phase' = "curated"
          /\ UNCHANGED <<version, releaseVersion, checked, released, context, cached>>
Tokenize == /\ phase = "curated" /\ phase' = "tokenized"
            /\ UNCHANGED <<version, releaseVersion, checked, released, context, cached>>
Pretrain == /\ phase = "tokenized" /\ phase' = "base" /\ version' = 1
            /\ UNCHANGED <<releaseVersion, checked, released, context, cached>>
SFT == /\ phase = "base" /\ phase' = "assistant" /\ version' = 2
       /\ UNCHANGED <<releaseVersion, checked, released, context, cached>>
Preference == /\ phase = "assistant" /\ phase' = "preferred" /\ version' = 3
              /\ UNCHANGED <<releaseVersion, checked, released, context, cached>>
Evaluate == /\ phase \in {"base", "assistant", "preferred"}
            /\ phase' = "evaluated" /\ checked' = TRUE
            /\ UNCHANGED <<version, releaseVersion, released, context, cached>>
Revise == /\ phase = "evaluated" /\ phase' = "raw" /\ checked' = FALSE
          /\ version' = 0 /\ UNCHANGED <<releaseVersion, released, context, cached>>
Release == /\ phase = "evaluated" /\ checked /\ phase' = "serve"
           /\ released' = TRUE /\ releaseVersion' = version
           /\ UNCHANGED <<version, checked, context, cached>>
Prefill == /\ phase = "serve" /\ phase' = "prefill"
           /\ context' = 3 /\ cached' = 3
           /\ UNCHANGED <<version, releaseVersion, checked, released>>
Sample == /\ phase \in {"prefill", "decode"} /\ context < 6
          /\ phase' = "decode" /\ context' = context + 1 /\ cached' = context
          /\ UNCHANGED <<version, releaseVersion, checked, released>>
End == /\ phase \in {"prefill", "decode"} /\ phase' = "done"
       /\ UNCHANGED <<version, releaseVersion, checked, released, context, cached>>
NewRequest == /\ phase = "done" /\ phase' = "serve" /\ context' = 0 /\ cached' = 0
              /\ UNCHANGED <<version, releaseVersion, checked, released>>
Done == /\ phase = "done" /\ UNCHANGED vars
Next == Curate \/ Tokenize \/ Pretrain \/ SFT \/ Preference \/ Evaluate \/ Revise
        \/ Release \/ Prefill \/ Sample \/ End \/ NewRequest \/ Done
ReleaseNeedsEvaluation == released => checked
FrozenDuringInference == phase \in {"serve", "prefill", "decode", "done"} => version = releaseVersion
CacheNeverSeesFuture == /\ cached <= context /\ context - cached <= 1
NoServingBeforeRelease == phase \in {"serve", "prefill", "decode", "done"} => released
=============================================================================
