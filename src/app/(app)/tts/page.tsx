"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GsModel } from "@/models"
import { useGsStore } from "@/store/gs-store/gs-store"
import { useMetaStore } from "@/store/meta-store/meta-store"

export default function Page() {
  // Get store state and methods
  const {
    apiEndpoint,
    connectionStatus,
    languageOptions,
    currentReferenceAudio,
    setReferenceAudio,
    connectToApi,
    sendTTSRequest,
    availableGptWeights,
    availableSovitsWeights,
    currentGptWeight,
    currentSovitsWeight,
    loadingWeights,
    fetchAvailableModels,
    availableReferenceAudios,
    loadingReferenceAudios,
    fetchReferenceAudios,
    getReferenceAudioByPath,
    changeGptWeight,
    changeSovitsWeight,
    changeReferenceAudio,
    errorMessage
  } = useGsStore()
  
  // Get meta store for status messages
  const { setStatusMessage, clearStatusMessage } = useMetaStore()
  
  // Local form state
  const [text, setText] = useState<string>("")
  const [textLang, setTextLang] = useState<string>("en")
  const [refAudioPath, setRefAudioPath] = useState<string>(currentReferenceAudio || "")
  const [promptText, setPromptText] = useState<string>("")
  const [promptLang, setPromptLang] = useState<string>("en")
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [changingModel, setChangingModel] = useState<boolean>(false)
  
  // Check API connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (connectionStatus === 'disconnected') {
        try {
          await connectToApi()
          setStatusMessage('success', `Successfully connected to ${apiEndpoint}`)
          console.log(`Connected to GPT-SoVits API at ${apiEndpoint}`)
        } catch (error) {
          setStatusMessage('error', error instanceof Error ? error.message : "Could not connect to GPT-SoVits API")
          console.error("Connection Failed:", error)
        }
      }
    }
    
    checkConnection()
  }, [connectToApi, connectionStatus, apiEndpoint, setStatusMessage])
  
  // Update reference audio path when store value changes
  useEffect(() => {
    if (currentReferenceAudio && currentReferenceAudio !== refAudioPath) {
      setRefAudioPath(currentReferenceAudio)
      
      // Look up prompt text if available
      const refAudio = getReferenceAudioByPath(currentReferenceAudio)
      console.log("Current reference audio:", refAudio);
      if (refAudio && refAudio.prompt_text) {
        console.log("Setting prompt text from currentReferenceAudio:", refAudio.prompt_text);
        setPromptText(refAudio.prompt_text)
      }
    }
  }, [currentReferenceAudio, refAudioPath, getReferenceAudioByPath]);
  
  // Set prompt text when availableReferenceAudios changes and we have a selected refAudioPath
  useEffect(() => {
    if (refAudioPath && availableReferenceAudios.length > 0) {
      const refAudio = getReferenceAudioByPath(refAudioPath);
      console.log("Reference audio from available list:", refAudio);
      if (refAudio && refAudio.prompt_text) {
        console.log("Setting prompt text from availableReferenceAudios change:", refAudio.prompt_text);
        setPromptText(refAudio.prompt_text);
      }
    }
  }, [availableReferenceAudios, refAudioPath, getReferenceAudioByPath]);
  
  // Fetch available models and reference audios when component mounts
  useEffect(() => {
    if (connectionStatus === 'connected') {
      // Fetch models
      fetchAvailableModels().catch(error => {
        console.error("Failed to fetch models:", error);
        setStatusMessage('error', "Failed to fetch available models");
      }).then(() => {
        // If refAudioPath is already set, check if we have prompt text for it
        if (refAudioPath) {
          const refAudio = getReferenceAudioByPath(refAudioPath);
          if (refAudio && refAudio.prompt_text) {
            setPromptText(refAudio.prompt_text);
          }
        }
      });
      
      // Fetch reference audios
      fetchReferenceAudios().catch(error => {
        console.error("Failed to fetch reference audios:", error);
        setStatusMessage('error', "Failed to fetch available reference audios");
      });
    }
  }, [fetchAvailableModels, fetchReferenceAudios, connectionStatus, refAudioPath, getReferenceAudioByPath, setStatusMessage]);
  
  // Update prompt text when reference audio selection changes
  const handleReferenceAudioChange = async (path: string) => {
    if (path === refAudioPath) return;
    
    setRefAudioPath(path);
    clearStatusMessage();
    
    // Look up prompt text if available
    const refAudio = getReferenceAudioByPath(path);
    console.log("Selected reference audio:", refAudio);
    if (refAudio && refAudio.prompt_text) {
      console.log("Setting prompt text to:", refAudio.prompt_text);
      setPromptText(refAudio.prompt_text);
    }
    
    // Send API request to change reference audio
    try {
      await changeReferenceAudio({ refer_audio_path: path });
      setStatusMessage('success', `Reference audio set to ${path.split('/').pop()}`);
    } catch (error) {
      setStatusMessage('error', error instanceof Error ? error.message : "Failed to set reference audio");
      console.error("Failed to set reference audio:", error);
    }
  };
  
  // Handle GPT model change
  const handleGptModelChange = async (weightPath: string) => {
    if (weightPath === currentGptWeight) return;
    
    setChangingModel(true);
    clearStatusMessage();
    
    try {
      await changeGptWeight({ weights_path: weightPath });
      setStatusMessage('success', `GPT model changed to ${weightPath.split('/').pop()}`);
    } catch (error) {
      setStatusMessage('error', error instanceof Error ? error.message : "Failed to change GPT model");
      console.error("Failed to change GPT model:", error);
    } finally {
      setChangingModel(false);
    }
  };
  
  // Handle SoVits model change
  const handleSovitsModelChange = async (weightPath: string) => {
    if (weightPath === currentSovitsWeight) return;
    
    setChangingModel(true);
    clearStatusMessage();
    
    try {
      await changeSovitsWeight({ weights_path: weightPath });
      setStatusMessage('success', `SoVits model changed to ${weightPath.split('/').pop()}`);
    } catch (error) {
      setStatusMessage('error', error instanceof Error ? error.message : "Failed to change SoVits model");
      console.error("Failed to change SoVits model:", error);
    } finally {
      setChangingModel(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!text) {
      setStatusMessage('error', "Please enter text to synthesize");
      return;
    }
    
    if (!refAudioPath) {
      setStatusMessage('error', "Please provide a reference audio path");
      return;
    }
    
    setIsGenerating(true);
    clearStatusMessage();
    
    // Clean up previous audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    try {
      const request: GsModel.GsTTSRequest = {
        text,
        text_lang: textLang,
        ref_audio_path: refAudioPath,
        prompt_text: promptText,
        prompt_lang: promptLang,
        aux_ref_audio_paths: [],
        top_k: 5,
        top_p: 1,
        temperature: 1,
        text_split_method: "cut0",
        batch_size: 1,
        batch_threshold: 0.75,
        split_bucket: true,
        speed_factor: 1.0,
        fragment_interval: 0.3,
        seed: -1,
        media_type: "wav",
        streaming_mode: false,
        parallel_infer: true,
        repetition_penalty: 1.35,
        sample_steps: 32,
        super_sampling: false
      };
      
      // Save reference audio to store
      if (refAudioPath) {
        setReferenceAudio(refAudioPath);
      }
      
      // Send request
      const audioBlob = await sendTTSRequest(request);
      
      // Create URL for the audio blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      setStatusMessage('success', "Your text has been successfully synthesized");
      console.log("Speech Generated Successfully");
    } catch (error) {
      setStatusMessage('error', error instanceof Error ? error.message : "Could not generate speech");
      console.error("Generation Failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left side - All parameters */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Synthesis Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* Models Section */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Select the models to use for synthesis</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Select 
                        disabled={connectionStatus !== 'connected' || loadingWeights || availableGptWeights.length === 0 || changingModel}
                        value={currentGptWeight} 
                        onValueChange={handleGptModelChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            connectionStatus !== 'connected' ? "Connect to API first" :
                            loadingWeights ? "Loading GPT models..." : 
                            "Select GPT model"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>GPT Models</SelectLabel>
                            {availableGptWeights.map((path) => (
                              <SelectItem key={path} value={path}>
                                {path.split('/').pop()}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {currentGptWeight && (
                        <p className="text-xs text-muted-foreground mt-1">Active: {currentGptWeight.split('/').pop()}</p>
                      )}
                    </div>
                    
                    <div>
                      <Select 
                        disabled={connectionStatus !== 'connected' || loadingWeights || availableSovitsWeights.length === 0 || changingModel}
                        value={currentSovitsWeight}
                        onValueChange={handleSovitsModelChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            connectionStatus !== 'connected' ? "Connect to API first" :
                            loadingWeights ? "Loading SoVits models..." : 
                            "Select SoVits model"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>SoVits Models</SelectLabel>
                            {availableSovitsWeights.map((path) => (
                              <SelectItem key={path} value={path}>
                                {path.split('/').pop()}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {currentSovitsWeight && (
                        <p className="text-xs text-muted-foreground mt-1">Active: {currentSovitsWeight.split('/').pop()}</p>
                      )}
                    </div>
                  </div>

                  {changingModel && (
                    <div className="text-sm text-amber-600 mt-2">
                      Changing model... Please wait.
                    </div>
                  )}
                  
                  {connectionStatus !== 'connected' && (
                    <div className="text-sm text-amber-600 mt-2 flex items-center">
                      <span className="mr-2">●</span>
                      {connectionStatus === 'connecting' ? "Connecting to API..." : 
                       connectionStatus === 'error' ? `API connection error: ${errorMessage || 'Unknown error'}` : 
                       "Not connected to API"}
                    </div>
                  )}
                </div>
                
                {/* Reference Audio Section */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Select a reference audio for voice cloning</p>
                  <Select 
                    disabled={connectionStatus !== 'connected' || loadingReferenceAudios}
                    value={refAudioPath} 
                    onValueChange={handleReferenceAudioChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        connectionStatus !== 'connected' ? "Connect to API first" :
                        loadingReferenceAudios ? "Loading reference audios..." : 
                        "Select reference audio"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Reference Audios</SelectLabel>
                        {availableReferenceAudios.map((audio) => (
                          <SelectItem key={audio.path} value={audio.path}>
                            {audio.filename} ({audio.size} KB)
                            {audio.prompt_text && (
                              <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Prompt
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                {refAudioPath && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Prompt text and language settings</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Textarea
                        placeholder="Prompt text for reference audio..."
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        rows={2}
                        className="col-span-2"
                        disabled={connectionStatus !== 'connected'}
                      />
                      
                      <Select 
                        value={promptLang} 
                        onValueChange={setPromptLang}
                        disabled={connectionStatus !== 'connected'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Prompt language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Languages</SelectLabel>
                            {Object.entries(languageOptions).map(([name, code]) => (
                              <SelectItem key={code} value={code}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={textLang} 
                        onValueChange={setTextLang}
                        disabled={connectionStatus !== 'connected'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Text language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Languages</SelectLabel>
                            {Object.entries(languageOptions).map(([name, code]) => (
                              <SelectItem key={code} value={code}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Input Text Section */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Enter the text you want to convert to speech</p>
                  <Textarea
                    placeholder="Enter text to synthesize..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    disabled={connectionStatus !== 'connected'}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {connectionStatus !== 'connected' ? (
                <Button 
                  onClick={() => connectToApi()} 
                  className="w-full"
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? "Connecting..." : "Connect to API"}
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="w-full"
                  disabled={isGenerating || !text || !refAudioPath || changingModel || loadingWeights || loadingReferenceAudios}
                >
                  {isGenerating ? "Generating..." : changingModel ? "Changing Models..." : "Generate Speech"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Right side - Synthesis result */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Generated Speech</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center min-h-[400px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-center text-muted-foreground">Generating speech...</p>
                </div>
              ) : audioUrl ? (
                <div className="w-full space-y-4">
                  <audio controls className="w-full" src={audioUrl} />
                  <div className="text-center text-sm text-muted-foreground">
                    {currentGptWeight && currentSovitsWeight && (
                      <>Generated from model {currentGptWeight.split('/').pop()} and {currentSovitsWeight.split('/').pop()}</>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>{connectionStatus !== 'connected' ? "API connection required" : "No audio generated yet"}</p>
                  <p className="mt-2 text-sm">
                    {connectionStatus !== 'connected' 
                      ? "Connect to the GPT-SoVits API to generate speech" 
                      : "Fill in the parameters on the left and click Generate Speech"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}