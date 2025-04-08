"use client";

import { useState, useEffect, useRef } from 'react';
import { useGsStore } from '@/store/gs-store/gs-store';
import { GsModel } from '@/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export default function TrainPage() {
  // Get store state and methods
  const {
    apiEndpoint,
    connectionStatus,
    availableSovitsWeights,
    availableGptWeights,
    activeTrainings,
    trainingLogs,
    isStartingTraining,
    fetchAvailableModels,
    startSoVITSTraining,
    startGPTTraining,
    fetchTrainingLogs,
    removeActiveTraining
  } = useGsStore();

  // State for selected training model to view logs
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [isPollingLogs, setIsPollingLogs] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedTrainingRef = useRef<string | null>(null);
  const trainingLogsRef = useRef(trainingLogs);

  // Form state for SoVITS training
  const [sovitsForm, setSovitsForm] = useState<GsModel.GsSoVITSTrainingRequest>({
    experimentName: '',
    pretrainedS2G: '',
    pretrainedS2D: '',
    ...GsModel.defaultSoVITSTrainingRequest
  });

  // Form state for GPT training
  const [gptForm, setGptForm] = useState<GsModel.GsGPTTrainingRequest>({
    experimentName: '',
    pretrainedS1: '',
    ...GsModel.defaultGPTTrainingRequest
  });

  // Status message for user feedback
  const [statusMessage, setStatusMessage] = useState('');

  // Keep refs updated with latest state
  useEffect(() => {
    selectedTrainingRef.current = selectedTraining;
  }, [selectedTraining]);

  useEffect(() => {
    trainingLogsRef.current = trainingLogs;
  }, [trainingLogs]);

  // Load available models on page load
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  // Set up polling for logs
  useEffect(() => {
    // Clean up previous interval if exists
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (!selectedTraining) return;

    // Parse training key into component parts
    const [experimentName, processType, version] = selectedTraining.split('_');
    if (!experimentName || !processType) return;

    console.log("Setting up log polling for:", { experimentName, processType, version });

    // Set polling flag
    setIsPollingLogs(true);

    // Check if logs are already loaded
    const logKey = selectedTraining;
    const logState = trainingLogsRef.current[logKey];
    
    console.log("Current log state:", logState);
    
    // Fetch initial logs if not loaded already
    if (!logState || logState.stdout.length === 0) {
      console.log("Fetching initial logs");
      fetchTrainingLogs({
        experimentName,
        processType: processType.toLowerCase() as 'sovits' | 'gpt',
        logType: 'stdout',
        version: version as "v1" | "v2" | "v3",
        offset: 0
      });
    }

    // Start polling interval
    pollingIntervalRef.current = setInterval(() => {
      console.log("Polling log interval fired");
      
      // Get current selected training from ref to avoid stale closures
      const currentSelectedTraining = selectedTrainingRef.current;
      console.log("Current selected training:", currentSelectedTraining);
      
      if (!currentSelectedTraining) {
        console.log("No training selected, skipping log poll");
        return;
      }

      // Parse training key again to ensure we have the latest
      const [expName, procType, ver] = currentSelectedTraining.split('_');
      console.log("Training key components:", { expName, procType, ver });
      
      // Get current log state from ref to avoid dependency on trainingLogs
      const currentLogState = trainingLogsRef.current[currentSelectedTraining];
      console.log("Current log state:", currentLogState);
      
      if (!currentLogState) {
        console.log("No log state found, skipping poll");
        return;
      }

      // Fetch stdout logs
      console.log("Fetching stdout logs with offset:", currentLogState.stdoutNextOffset || 0);
      fetchTrainingLogs({
        experimentName: expName,
        processType: procType.toLowerCase() as 'sovits' | 'gpt',
        logType: 'stdout',
        version: ver as "v1" | "v2" | "v3",
        offset: currentLogState.stdoutNextOffset || 0
      });
      
      // Fetch stderr logs
      console.log("Fetching stderr logs with offset:", currentLogState.stderrNextOffset || 0);
      fetchTrainingLogs({
        experimentName: expName,
        processType: procType.toLowerCase() as 'sovits' | 'gpt',
        logType: 'stderr',
        version: ver as "v1" | "v2" | "v3",
        offset: currentLogState.stderrNextOffset || 0
      });
    }, 5000); // Poll every 5 seconds

    // Clean up
    return () => {
      console.log("Cleaning up log polling interval");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPollingLogs(false);
    };
  }, [selectedTraining, fetchTrainingLogs]); // Remove trainingLogs from dependency array

  // Handle SoVITS form submit
  const handleSovitsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Starting SoVITS training...');
    
    try {
      const response = await startSoVITSTraining(sovitsForm);
      
      if (response.success) {
        setStatusMessage(`SoVITS training started for experiment "${sovitsForm.experimentName}"`);
        
        // Select the new training to view logs - ensure process type is lowercase
        setSelectedTraining(`${sovitsForm.experimentName}_sovits_${sovitsForm.version || 'v2'}`);
      } else {
        setStatusMessage(`Error starting SoVITS training: ${response.error || response.message}`);
      }
    } catch (error) {
      setStatusMessage(`Error starting SoVITS training: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle GPT form submit
  const handleGptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('Starting GPT training...');
    
    try {
      const response = await startGPTTraining(gptForm);
      
      if (response.success) {
        setStatusMessage(`GPT training started for experiment "${gptForm.experimentName}"`);
        
        // Select the new training to view logs - ensure process type is lowercase
        setSelectedTraining(`${gptForm.experimentName}_gpt_${gptForm.version || 'v2'}`);
      } else {
        setStatusMessage(`Error starting GPT training: ${response.error || response.message}`);
      }
    } catch (error) {
      setStatusMessage(`Error starting GPT training: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Current selected training logs
  const selectedLogs = selectedTraining ? trainingLogs[selectedTraining] : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Train GPT-SoVITS Models</h1>
      
      {/* Status message */}
      {statusMessage && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
          {statusMessage}
        </div>
      )}
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Training forms */}
        <div className="space-y-6">
          <Tabs defaultValue="sovits">
            <TabsList className="w-full">
              <TabsTrigger value="sovits" className="flex-1">SoVITS Training</TabsTrigger>
              <TabsTrigger value="gpt" className="flex-1">GPT Training</TabsTrigger>
            </TabsList>
            
            {/* SoVITS Training Form */}
            <TabsContent value="sovits">
              <Card>
                <CardHeader>
                  <CardTitle>SoVITS Training</CardTitle>
                  <CardDescription>
                    Train the SoVITS model for voice conversion
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSovitsSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="experimentName">Experiment Name</Label>
                      <Input
                        id="experimentName"
                        placeholder="my_singer"
                        value={sovitsForm.experimentName}
                        onChange={(e) => setSovitsForm({...sovitsForm, experimentName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pretrainedS2G">Pretrained S2G Model</Label>
                      <Select
                        value={sovitsForm.pretrainedS2G}
                        onValueChange={(value) => setSovitsForm({...sovitsForm, pretrainedS2G: value})}
                        required
                      >
                        <SelectTrigger id="pretrainedS2G">
                          <SelectValue placeholder="Select pretrained S2G model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s2G2333k.pth">
                            s2G2333k.pth (Default v2)
                          </SelectItem>
                          {availableSovitsWeights.map((weight) => (
                            <SelectItem key={weight} value={weight}>
                              {weight.split('/').pop() || weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pretrainedS2D">Pretrained S2D Model</Label>
                      <Select
                        value={sovitsForm.pretrainedS2D}
                        onValueChange={(value) => setSovitsForm({...sovitsForm, pretrainedS2D: value})}
                        required
                      >
                        <SelectTrigger id="pretrainedS2D">
                          <SelectValue placeholder="Select pretrained S2D model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s2D2333k.pth">
                            s2D2333k.pth (Default v2)
                          </SelectItem>
                          {availableSovitsWeights.map((weight) => (
                            <SelectItem key={weight} value={weight}>
                              {weight.split('/').pop() || weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="batchSize">Batch Size</Label>
                        <Input
                          id="batchSize"
                          type="number"
                          min="1"
                          max="64"
                          value={sovitsForm.batchSize}
                          onChange={(e) => setSovitsForm({...sovitsForm, batchSize: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="totalEpoch">Total Epochs</Label>
                        <Input
                          id="totalEpoch"
                          type="number"
                          min="1"
                          max="100"
                          value={sovitsForm.totalEpoch}
                          onChange={(e) => setSovitsForm({...sovitsForm, totalEpoch: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="saveEveryEpoch">Save Every Epoch</Label>
                        <Input
                          id="saveEveryEpoch"
                          type="number"
                          min="1"
                          max="50"
                          value={sovitsForm.saveEveryEpoch}
                          onChange={(e) => setSovitsForm({...sovitsForm, saveEveryEpoch: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gpuIds">GPU IDs</Label>
                        <Input
                          id="gpuIds"
                          placeholder="0"
                          value={sovitsForm.gpuIds}
                          onChange={(e) => setSovitsForm({...sovitsForm, gpuIds: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="version">Model Version</Label>
                      <Select
                        value={sovitsForm.version}
                        onValueChange={(value: "v1" | "v2" | "v3") => setSovitsForm({...sovitsForm, version: value})}
                      >
                        <SelectTrigger id="version">
                          <SelectValue placeholder="Select model version" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="v1">v1</SelectItem>
                          <SelectItem value="v2">v2 (Recommended)</SelectItem>
                          <SelectItem value="v3">v3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ifSaveLatest"
                        checked={sovitsForm.ifSaveLatest}
                        onCheckedChange={(checked: boolean) => setSovitsForm({...sovitsForm, ifSaveLatest: checked})}
                      />
                      <Label htmlFor="ifSaveLatest">Save Latest Checkpoint</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ifSaveEveryWeights"
                        checked={sovitsForm.ifSaveEveryWeights}
                        onCheckedChange={(checked: boolean) => setSovitsForm({...sovitsForm, ifSaveEveryWeights: checked})}
                      />
                      <Label htmlFor="ifSaveEveryWeights">Save Every Weights</Label>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isStartingTraining || connectionStatus !== 'connected'}>
                      {isStartingTraining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting Training...
                        </>
                      ) : (
                        'Start SoVITS Training'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            {/* GPT Training Form */}
            <TabsContent value="gpt">
              <Card>
                <CardHeader>
                  <CardTitle>GPT Training</CardTitle>
                  <CardDescription>
                    Train the GPT model for text-to-speech
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleGptSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gptExperimentName">Experiment Name</Label>
                      <Input
                        id="gptExperimentName"
                        placeholder="my_singer"
                        value={gptForm.experimentName}
                        onChange={(e) => setGptForm({...gptForm, experimentName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pretrainedS1">Pretrained S1 Model</Label>
                      <Select
                        value={gptForm.pretrainedS1}
                        onValueChange={(value) => setGptForm({...gptForm, pretrainedS1: value})}
                        required
                      >
                        <SelectTrigger id="pretrainedS1">
                          <SelectValue placeholder="Select pretrained S1 model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPT_SoVITS/pretrained_models/gsv-v2final-pretrained/s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt">
                            s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt (Default v2)
                          </SelectItem>
                          {availableGptWeights.map((weight) => (
                            <SelectItem key={weight} value={weight}>
                              {weight.split('/').pop() || weight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gptBatchSize">Batch Size</Label>
                        <Input
                          id="gptBatchSize"
                          type="number"
                          min="1"
                          max="64"
                          value={gptForm.batchSize}
                          onChange={(e) => setGptForm({...gptForm, batchSize: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gptTotalEpoch">Total Epochs</Label>
                        <Input
                          id="gptTotalEpoch"
                          type="number"
                          min="1"
                          max="100"
                          value={gptForm.totalEpoch}
                          onChange={(e) => setGptForm({...gptForm, totalEpoch: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gptSaveEveryEpoch">Save Every Epoch</Label>
                        <Input
                          id="gptSaveEveryEpoch"
                          type="number"
                          min="1"
                          max="50"
                          value={gptForm.saveEveryEpoch}
                          onChange={(e) => setGptForm({...gptForm, saveEveryEpoch: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gptGpuIds">GPU IDs</Label>
                        <Input
                          id="gptGpuIds"
                          placeholder="0"
                          value={gptForm.gpuIds}
                          onChange={(e) => setGptForm({...gptForm, gpuIds: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gptVersion">Model Version</Label>
                      <Select
                        value={gptForm.version}
                        onValueChange={(value: "v1" | "v2" | "v3") => setGptForm({...gptForm, version: value})}
                      >
                        <SelectTrigger id="gptVersion">
                          <SelectValue placeholder="Select model version" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="v1">v1</SelectItem>
                          <SelectItem value="v2">v2 (Recommended)</SelectItem>
                          <SelectItem value="v3">v3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gptIfSaveLatest"
                        checked={gptForm.ifSaveLatest}
                        onCheckedChange={(checked: boolean) => setGptForm({...gptForm, ifSaveLatest: checked})}
                      />
                      <Label htmlFor="gptIfSaveLatest">Save Latest Checkpoint</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gptIfSaveEveryWeights"
                        checked={gptForm.ifSaveEveryWeights}
                        onCheckedChange={(checked: boolean) => setGptForm({...gptForm, ifSaveEveryWeights: checked})}
                      />
                      <Label htmlFor="gptIfSaveEveryWeights">Save Every Weights</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gptIfDpo"
                        checked={gptForm.ifDpo}
                        onCheckedChange={(checked: boolean) => setGptForm({...gptForm, ifDpo: checked})}
                      />
                      <Label htmlFor="gptIfDpo">Enable DPO Training</Label>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isStartingTraining || connectionStatus !== 'connected'}>
                      {isStartingTraining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting Training...
                        </>
                      ) : (
                        'Start GPT Training'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Active trainings and logs */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Trainings</CardTitle>
              <CardDescription>
                Currently running training jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTrainings.length > 0 ? (
                <div className="space-y-2">
                  {activeTrainings
                    .sort((a, b) => b.startTime - a.startTime)
                    .map((training) => {
                      // Ensure process type is lowercase for the key
                      const trainingKey = `${training.experimentName}_${training.processType.toLowerCase()}_${training.version}`;
                      return (
                        <div 
                          key={trainingKey}
                          className={`p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedTraining === trainingKey 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => setSelectedTraining(trainingKey)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{training.experimentName}</div>
                              <div className="text-sm text-muted-foreground">
                                {training.processType === 'sovits' ? 'SoVITS' : 'GPT'} ({training.version})
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className={`px-2 py-1 rounded-full text-xs ${
                                training.status === 'running' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {training.status}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Ensure process type is lowercase when removing
                                  removeActiveTraining(
                                    training.experimentName,
                                    training.processType.toLowerCase() as 'sovits' | 'gpt',
                                    training.version
                                  );
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active training jobs
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Training logs */}
          {selectedTraining && selectedLogs && (
            <Card>
              <CardHeader>
                <CardTitle>Training Logs</CardTitle>
                <CardDescription>
                  Logs for selected training job
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="stdout">
                  <TabsList className="w-full">
                    <TabsTrigger value="stdout" className="flex-1">Standard Output</TabsTrigger>
                    <TabsTrigger value="stderr" className="flex-1">Standard Error</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="stdout">
                    <div className="relative">
                      {selectedLogs.isLoading && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                      <ScrollArea className="h-96 border rounded-md bg-muted/30 p-4">
                        <pre className="font-mono text-xs">
                          {selectedLogs.stdout.length > 0 
                            ? selectedLogs.stdout.join('\n') 
                            : 'No output logs available yet...'}
                        </pre>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="stderr">
                    <div className="relative">
                      {selectedLogs.isLoading && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                      <ScrollArea className="h-96 border rounded-md bg-muted/30 p-4">
                        <pre className="font-mono text-xs text-red-500 dark:text-red-400">
                          {selectedLogs.stderr.length > 0 
                            ? selectedLogs.stderr.join('\n') 
                            : 'No error logs available...'}
                        </pre>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
