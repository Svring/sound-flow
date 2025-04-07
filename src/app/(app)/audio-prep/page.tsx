"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useGsStore } from "@/store/gs-store/gs-store";
import { GsModel } from "@/models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Music, Mic, FileUp } from "lucide-react";
import { FileBrowser } from "@/components/file-browser";

export default function AudioPrepPage() {
  const [activeTab, setActiveTab] = useState("uvr5");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [fetchCooldown, setFetchCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  // Use a ref to keep track of the timer
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    availableUVR5Models,
    loadingUVR5Models,
    fetchUVR5Models,
    sendUVR5Request,
    
    availableASRModels,
    loadingASRModels,
    fetchASRModels,
    sendASRRequest,
    
    sendSegmentAudioRequest
  } = useGsStore();

  // Cleanup function for timer
  const clearCooldownTimer = () => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  // Start cooldown timer
  const startCooldown = () => {
    // Clear any existing timer first
    clearCooldownTimer();
    
    setFetchCooldown(true);
    setCooldownSeconds(15);
    
    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearCooldownTimer();
          setFetchCooldown(false);
          return 0;
        }
        return newValue;
      });
    }, 1000);
  };

  // Clear the timer on component unmount
  useEffect(() => {
    return () => clearCooldownTimer();
  }, []);

  // Fetch models on component mount or tab change
  useEffect(() => {
    if (fetchCooldown) return;
    
    if (activeTab === "uvr5" && availableUVR5Models.length === 0 && !loadingUVR5Models) {
      fetchUVR5Models().catch(error => {
        console.error("Failed to fetch UVR5 models:", error);
        setError("Failed to fetch UVR5 models. Will retry in 15 seconds.");
        startCooldown();
      });
    }
    
    if (activeTab === "asr" && availableASRModels.length === 0 && !loadingASRModels) {
      fetchASRModels().catch(error => {
        console.error("Failed to fetch ASR models:", error);
        setError("Failed to fetch ASR models. Will retry in 15 seconds.");
        startCooldown();
      });
    }
  }, [activeTab, availableUVR5Models, loadingUVR5Models, fetchUVR5Models, availableASRModels, loadingASRModels, fetchASRModels, fetchCooldown]);

  // UVR5 state
  const [uvr5State, setUvr5State] = useState<GsModel.GsUVR5Request>({
    model_name: "HP3",
    input_path: "",
    output_dir_vocals: "output/uvr5_vocals",
    output_dir_instrumental: "output/uvr5_inst",
    aggressiveness: 10,
    output_format: "wav",
    device: "cuda",
    use_half_precision: true
  });

  // Audio Segmentation state
  const [segmentState, setSegmentState] = useState<GsModel.GsSegmentAudioRequest>({
    input_audio_path: "",
    output_directory: "output/slicer_opt",
    silence_threshold_db: -34,
    min_segment_length_ms: 4000,
    min_silence_interval_ms: 300,
    analysis_hop_size_ms: 10,
    max_silence_kept_ms: 500,
    normalization_max_amplitude: 0.9,
    normalization_mix_factor: 0.25,
    parallel_process_count: 1
  });

  // ASR state
  const [asrState, setAsrState] = useState<GsModel.GsASRRequest>({
    input_audio_path: "",
    output_directory: "output/asr_opt",
    model: "达摩 ASR (中文)",
    model_size: "large",
    language: "zh",
    precision: "float32"
  });

  // File browser state
  const [fileBrowserConfig, setFileBrowserConfig] = useState<{
    targetField: string;
    directory: string;
    allowedExtensions: string[];
  }>({
    targetField: "",
    directory: "",
    allowedExtensions: []
  });

  // Handle file selection from file browser
  const handleFileSelect = (filePath: string) => {
    // Update the appropriate state based on which field is being populated
    if (fileBrowserConfig.targetField.startsWith("uvr5.")) {
      const field = fileBrowserConfig.targetField.split(".")[1];
      setUvr5State((prev: GsModel.GsUVR5Request) => ({ ...prev, [field]: filePath }));
    } else if (fileBrowserConfig.targetField.startsWith("segment.")) {
      const field = fileBrowserConfig.targetField.split(".")[1];
      setSegmentState((prev: GsModel.GsSegmentAudioRequest) => ({ ...prev, [field]: filePath }));
    } else if (fileBrowserConfig.targetField.startsWith("asr.")) {
      const field = fileBrowserConfig.targetField.split(".")[1];
      setAsrState((prev: GsModel.GsASRRequest) => ({ ...prev, [field]: filePath }));
    }
    
    // Close file browser after selection
    setShowFileBrowser(false);
  };

  // Open file browser for a specific field
  const openFileBrowser = (fieldName: string, directory: string = "", extensions: string[] = []) => {
    setFileBrowserConfig({
      targetField: fieldName,
      directory,
      allowedExtensions: extensions
    });
    setShowFileBrowser(true);
  };

  // Handle UVR5 request
  const handleUVR5Request = async () => {
    if (isLoading || fetchCooldown) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await sendUVR5Request(uvr5State);
      
      if (response.success) {
        setSuccess(`Successfully processed ${response.processed_files.length} files`);
      } else {
        setError("Failed to process audio files");
        startCooldown();
      }
    } catch (error) {
      console.error("UVR5 request failed:", error);
      setError(`${error instanceof Error ? error.message : "Failed to process audio"}. Please try again in 15 seconds.`);
      startCooldown();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Audio Segmentation request
  const handleSegmentRequest = async () => {
    if (isLoading || fetchCooldown) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await sendSegmentAudioRequest(segmentState);
      
      if (response.success) {
        setSuccess(`Successfully segmented audio into ${response.output_files_count || response.output_files.length} segments`);
      } else {
        setError("Failed to segment audio file");
        startCooldown();
      }
    } catch (error) {
      console.error("Audio segmentation request failed:", error);
      setError(`${error instanceof Error ? error.message : "Failed to segment audio"}. Please try again in 15 seconds.`);
      startCooldown();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ASR request
  const handleASRRequest = async () => {
    if (isLoading || fetchCooldown) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await sendASRRequest(asrState);
      
      if (response.success) {
        setSuccess(`Successfully transcribed ${response.transcription_count || response.transcriptions.length} segments`);
      } else {
        setError("Failed to transcribe audio");
        startCooldown();
      }
    } catch (error) {
      console.error("ASR request failed:", error);
      setError(`${error instanceof Error ? error.message : "Failed to transcribe audio"}. Please try again in 15 seconds.`);
      startCooldown();
    } finally {
      setIsLoading(false);
    }
  };

  // Create a file input field with browse button
  interface FileInputWithBrowseProps {
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    browseField: string;
    browseDir?: string;
    extensions?: string[];
    placeholder?: string;
  }

  const FileInputWithBrowse = ({ 
    label, 
    value, 
    onChange, 
    browseField, 
    browseDir = "",
    extensions = [],
    placeholder = "Select a file or directory" 
  }: FileInputWithBrowseProps) => (
    <div className="grid gap-3">
      <Label htmlFor={browseField}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={browseField}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="flex-1"
        />
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => openFileBrowser(browseField, browseDir, extensions)}
        >
          <FileUp className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Audio Preprocessing</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {showFileBrowser ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>File Browser</CardTitle>
            <CardDescription>
              Select a file or navigate through directories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileBrowser
              onFileSelect={handleFileSelect}
              allowedExtensions={fileBrowserConfig.allowedExtensions}
              startDirectory={fileBrowserConfig.directory}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowFileBrowser(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          defaultValue="uvr5"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="uvr5" disabled={isLoading}>
              <Music className="mr-2 h-4 w-4" />
              Voice Separation (UVR5)
            </TabsTrigger>
            <TabsTrigger value="segment" disabled={isLoading}>
              <FileUp className="mr-2 h-4 w-4" />
              Audio Segmentation
            </TabsTrigger>
            <TabsTrigger value="asr" disabled={isLoading}>
              <Mic className="mr-2 h-4 w-4" />
              Speech Recognition (ASR)
            </TabsTrigger>
          </TabsList>
          
          {/* UVR5 Tab Content */}
          <TabsContent value="uvr5">
            <Card>
              <CardHeader>
                <CardTitle>Voice Separation with UVR5</CardTitle>
                <CardDescription>
                  Separate vocals from instrumental audio using AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <FileInputWithBrowse
                    label="Input Audio Path"
                    value={uvr5State.input_path}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUvr5State({ ...uvr5State, input_path: e.target.value })}
                    browseField="uvr5.input_path"
                    extensions={['.wav', '.mp3', '.flac', '.m4a']}
                    placeholder="test/example.mp3"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="uvr5-model-name">UVR5 Model</Label>
                      <Select
                        value={uvr5State.model_name}
                        onValueChange={(value) => setUvr5State({ ...uvr5State, model_name: value })}
                      >
                        <SelectTrigger id="uvr5-model-name">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingUVR5Models ? (
                            <SelectItem value="loading">Loading models...</SelectItem>
                          ) : (
                            availableUVR5Models.map((model) => (
                              <SelectItem key={model.model_name} value={model.model_name}>
                                {model.model_name}
                                {model.type && ` (${model.type})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="uvr5-output-format">Output Format</Label>
                      <Select
                        value={uvr5State.output_format}
                        onValueChange={(value: "wav" | "flac" | "mp3" | "m4a") => 
                          setUvr5State({ ...uvr5State, output_format: value })}
                      >
                        <SelectTrigger id="uvr5-output-format">
                          <SelectValue placeholder="Output format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wav">WAV</SelectItem>
                          <SelectItem value="flac">FLAC</SelectItem>
                          <SelectItem value="mp3">MP3</SelectItem>
                          <SelectItem value="m4a">M4A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="uvr5-aggressiveness">Aggressiveness ({uvr5State.aggressiveness})</Label>
                    <Slider
                      id="uvr5-aggressiveness"
                      min={0}
                      max={20}
                      step={1}
                      value={[uvr5State.aggressiveness]}
                      onValueChange={(values) => setUvr5State({ ...uvr5State, aggressiveness: values[0] })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Higher values provide stronger separation but may introduce artifacts
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FileInputWithBrowse
                      label="Vocals Output Directory"
                      value={uvr5State.output_dir_vocals}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setUvr5State({ ...uvr5State, output_dir_vocals: e.target.value })}
                      browseField="uvr5.output_dir_vocals"
                      browseDir="output"
                    />
                    
                    <FileInputWithBrowse
                      label="Instrumental Output Directory"
                      value={uvr5State.output_dir_instrumental}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setUvr5State({ ...uvr5State, output_dir_instrumental: e.target.value })}
                      browseField="uvr5.output_dir_instrumental"
                      browseDir="output"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="uvr5-device">Processing Device</Label>
                      <Select
                        value={uvr5State.device}
                        onValueChange={(value: "cuda" | "cpu") => 
                          setUvr5State({ ...uvr5State, device: value })}
                      >
                        <SelectTrigger id="uvr5-device">
                          <SelectValue placeholder="Device" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cuda">CUDA (GPU)</SelectItem>
                          <SelectItem value="cpu">CPU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-3 items-center">
                      <Label>Half Precision</Label>
                      <Select
                        value={uvr5State.use_half_precision ? "true" : "false"}
                        onValueChange={(value) => setUvr5State({ ...uvr5State, use_half_precision: value === "true" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Half Precision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Enabled (Faster)</SelectItem>
                          <SelectItem value="false">Disabled (Higher Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleUVR5Request}
                    disabled={isLoading || !uvr5State.input_path || fetchCooldown}
                    className="w-full"
                  >
                    {isLoading ? "Processing..." : fetchCooldown ? `Cooldown (${cooldownSeconds}s)` : "Process Audio"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Audio Segmentation Tab Content */}
          <TabsContent value="segment">
            <Card>
              <CardHeader>
                <CardTitle>Audio Segmentation</CardTitle>
                <CardDescription>
                  Slice longer audio into smaller segments based on silence detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <FileInputWithBrowse
                    label="Input Audio Path"
                    value={segmentState.input_audio_path}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSegmentState({ ...segmentState, input_audio_path: e.target.value })}
                    browseField="segment.input_audio_path"
                    extensions={['.wav', '.mp3', '.flac', '.m4a']}
                    placeholder="test/long_audio.wav"
                  />
                  
                  <FileInputWithBrowse
                    label="Output Directory"
                    value={segmentState.output_directory}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSegmentState({ ...segmentState, output_directory: e.target.value })}
                    browseField="segment.output_directory"
                    browseDir="output"
                  />
                  
                  <div className="grid gap-3">
                    <Label htmlFor="segment-silence-threshold">
                      Silence Threshold ({segmentState.silence_threshold_db} dB)
                    </Label>
                    <Slider
                      id="segment-silence-threshold"
                      min={-60}
                      max={-10}
                      step={1}
                      value={[segmentState.silence_threshold_db]}
                      onValueChange={(values) => setSegmentState({ ...segmentState, silence_threshold_db: values[0] })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Sound level below which is considered silence (-34 dB default)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="segment-min-length">
                        Min Segment Length ({segmentState.min_segment_length_ms} ms)
                      </Label>
                      <Slider
                        id="segment-min-length"
                        min={1000}
                        max={10000}
                        step={100}
                        value={[segmentState.min_segment_length_ms]}
                        onValueChange={(values) => setSegmentState({ ...segmentState, min_segment_length_ms: values[0] })}
                      />
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="segment-min-silence">
                        Min Silence Interval ({segmentState.min_silence_interval_ms} ms)
                      </Label>
                      <Slider
                        id="segment-min-silence"
                        min={100}
                        max={1000}
                        step={50}
                        value={[segmentState.min_silence_interval_ms]}
                        onValueChange={(values) => setSegmentState({ ...segmentState, min_silence_interval_ms: values[0] })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="segment-max-silence">
                        Max Silence Kept ({segmentState.max_silence_kept_ms} ms)
                      </Label>
                      <Slider
                        id="segment-max-silence"
                        min={100}
                        max={1000}
                        step={50}
                        value={[segmentState.max_silence_kept_ms]}
                        onValueChange={(values) => setSegmentState({ ...segmentState, max_silence_kept_ms: values[0] })}
                      />
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="segment-parallel">Parallel Process Count</Label>
                      <Select
                        value={segmentState.parallel_process_count.toString()}
                        onValueChange={(value) => setSegmentState({ ...segmentState, parallel_process_count: parseInt(value) })}
                      >
                        <SelectTrigger id="segment-parallel">
                          <SelectValue placeholder="Parallel processes" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 4, 8].map((count) => (
                            <SelectItem key={count} value={count.toString()}>
                              {count} {count === 1 ? "process" : "processes"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleSegmentRequest}
                    disabled={isLoading || !segmentState.input_audio_path || fetchCooldown}
                    className="w-full"
                  >
                    {isLoading ? "Processing..." : fetchCooldown ? `Cooldown (${cooldownSeconds}s)` : "Segment Audio"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ASR Tab Content */}
          <TabsContent value="asr">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Speech Recognition (ASR)</CardTitle>
                <CardDescription>
                  Transcribe speech audio into text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <FileInputWithBrowse
                    label="Input Audio Path"
                    value={asrState.input_audio_path}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAsrState({ ...asrState, input_audio_path: e.target.value })}
                    browseField="asr.input_audio_path"
                    extensions={['.wav', '.mp3', '.flac', '.m4a']}
                    placeholder="output/slicer_opt"
                  />
                  
                  <FileInputWithBrowse
                    label="Output Directory"
                    value={asrState.output_directory}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAsrState({ ...asrState, output_directory: e.target.value })}
                    browseField="asr.output_directory"
                    browseDir="output"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="asr-model">ASR Model</Label>
                      <Select
                        value={asrState.model}
                        onValueChange={(value) => setAsrState({ ...asrState, model: value })}
                      >
                        <SelectTrigger id="asr-model">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingASRModels ? (
                            <SelectItem value="loading">Loading models...</SelectItem>
                          ) : (
                            availableASRModels.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="asr-model-size">Model Size</Label>
                      <Select
                        value={asrState.model_size}
                        onValueChange={(value) => setAsrState({ ...asrState, model_size: value })}
                      >
                        <SelectTrigger id="asr-model-size">
                          <SelectValue placeholder="Model size" />
                        </SelectTrigger>
                        <SelectContent>
                          {asrState.model.includes("达摩") ? (
                            <SelectItem value="large">Large</SelectItem>
                          ) : (
                            ["tiny", "base", "small", "medium", "large-v3"].map((size) => (
                              <SelectItem key={size} value={size}>
                                {size.charAt(0).toUpperCase() + size.slice(1)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="asr-language">Language</Label>
                      <Select
                        value={asrState.language}
                        onValueChange={(value) => setAsrState({ ...asrState, language: value })}
                      >
                        <SelectTrigger id="asr-language">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {asrState.model.includes("达摩") ? (
                            <>
                              <SelectItem value="zh">中文 (Mandarin)</SelectItem>
                              <SelectItem value="yue">粤语 (Cantonese)</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="auto">Auto Detect</SelectItem>
                              <SelectItem value="zh">中文 (Chinese)</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                              <SelectItem value="ko">한국어 (Korean)</SelectItem>
                              <SelectItem value="yue">粤语 (Cantonese)</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="asr-precision">Precision</Label>
                      <Select
                        value={asrState.precision}
                        onValueChange={(value) => setAsrState({ ...asrState, precision: value })}
                      >
                        <SelectTrigger id="asr-precision">
                          <SelectValue placeholder="Precision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="float32">float32 (Highest Quality)</SelectItem>
                          <SelectItem value="float16">float16 (Good Balance)</SelectItem>
                          <SelectItem value="int8">int8 (Fastest)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleASRRequest}
                    disabled={isLoading || !asrState.input_audio_path || fetchCooldown}
                    className="w-full"
                  >
                    {isLoading ? "Transcribing..." : fetchCooldown ? `Cooldown (${cooldownSeconds}s)` : "Transcribe Audio"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 