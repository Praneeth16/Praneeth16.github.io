---- MODULE LLMBuild ----
EXTENDS Naturals
VARIABLE phase
vars == <<phase>>
Init == phase = "s0"
Moves0Tos1 == /\ phase = "s0" /\ phase' = "s1"
Moves0Tos2 == /\ phase = "s0" /\ phase' = "s2"
Moves1Tos2 == /\ phase = "s1" /\ phase' = "s2"
Moves2Tos3 == /\ phase = "s2" /\ phase' = "s3"
Moves3Tos4 == /\ phase = "s3" /\ phase' = "s4"
Moves3Tos5 == /\ phase = "s3" /\ phase' = "s5"
Moves4Tos6 == /\ phase = "s4" /\ phase' = "s6"
Moves4Tos5 == /\ phase = "s4" /\ phase' = "s5"
Moves5Tos4 == /\ phase = "s5" /\ phase' = "s4"
Moves6Tos7 == /\ phase = "s6" /\ phase' = "s7"
Moves7Tos9 == /\ phase = "s7" /\ phase' = "s9"
Moves7Tos8 == /\ phase = "s7" /\ phase' = "s8"
Moves8Tos7 == /\ phase = "s8" /\ phase' = "s7"
Moves9Tos10 == /\ phase = "s9" /\ phase' = "s10"
Moves9Tos4 == /\ phase = "s9" /\ phase' = "s4"
Moves10Tos11 == /\ phase = "s10" /\ phase' = "s11"
Moves11Tos13 == /\ phase = "s11" /\ phase' = "s13"
Moves11Tos12 == /\ phase = "s11" /\ phase' = "s12"
Moves12Tos11 == /\ phase = "s12" /\ phase' = "s11"
Moves13Tos14 == /\ phase = "s13" /\ phase' = "s14"
Moves14Tos15 == /\ phase = "s14" /\ phase' = "s15"
Moves15Tos0 == /\ phase = "s15" /\ phase' = "s0"
Next == Moves0Tos1 \/ Moves0Tos2 \/ Moves1Tos2 \/ Moves2Tos3 \/ Moves3Tos4 \/ Moves3Tos5 \/ Moves4Tos6 \/ Moves4Tos5 \/ Moves5Tos4 \/ Moves6Tos7 \/ Moves7Tos9 \/ Moves7Tos8 \/ Moves8Tos7 \/ Moves9Tos10 \/ Moves9Tos4 \/ Moves10Tos11 \/ Moves11Tos13 \/ Moves11Tos12 \/ Moves12Tos11 \/ Moves13Tos14 \/ Moves14Tos15 \/ Moves15Tos0
NoFutureTokenLeakage == phase # "s5"
FiniteWeightsAndLoss == phase # "s8"
NoRewardExploit == phase # "s12"
====
