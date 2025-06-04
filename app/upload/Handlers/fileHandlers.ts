import { parseJSONWatchHistory } from "../VideoParsing/jsonParser";

export function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, {
    setIsLoading,
    setError,
    setSuccessCount,
    setWatchHistory,
    dateRange,
    maxVideosPerDay,
    fetchVideoInfo,
    openai,
    OpenAILogger,
    parseJSONWatchHistory,
    parseWatchHistory
    }: any) {

    const file = e.target.files?.[0];
    console.log("✅file", file);

    if (file) {
        setIsLoading(true);
        setError(null);
        setSuccessCount(0);

        // JSON 파일 파싱
        if (file.name.endsWith('.json')) {
        parseJSONWatchHistory(file, dateRange, maxVideosPerDay, (current: number) => {
            setSuccessCount(current);
        })
            .then((processedHistory: any) => {
            setWatchHistory(processedHistory);
            localStorage.setItem('selectedItems', JSON.stringify(processedHistory));
            })
            .catch((error: any) => {
            setError(error.message);
            })
            .finally(() => setIsLoading(false));
        } 
        
        // HTML 파일 파싱
        else if (file.name.endsWith('.html')) {
        parseWatchHistory(
            file,
            dateRange,
            maxVideosPerDay,
            setSuccessCount,
            fetchVideoInfo,
            setError,
            openai,
            OpenAILogger
        ).finally(() => setIsLoading(false));
        } else {
        setError('지원하지 않는 파일 형식입니다. .json 또는 .html 파일을 업로드해주세요.');
        setIsLoading(false);
        }
    }
    }

    export function handleDragEnter(e: React.DragEvent<HTMLDivElement>, setIsDragging: (v: boolean) => void) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    }

    export function handleDragLeave(e: React.DragEvent<HTMLDivElement>, setIsDragging: (v: boolean) => void) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    }

    export function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    }

    export function handleDrop(e: React.DragEvent<HTMLDivElement>, {
    setIsDragging,
    setIsLoading,
    setError,
    setSuccessCount,
    dateRange,
    maxVideosPerDay,
    fetchVideoInfo,
    openai,
    OpenAILogger,
    parseWatchHistory,
    setWatchHistory
    }: any) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    console.log("✅files", files);
    if (files.length) {
        const file = files[0];
        // JSON 파일 파싱
        if (file.name.endsWith('.json')) {
            parseJSONWatchHistory(file, dateRange, maxVideosPerDay, (current: number) => {
                setSuccessCount(current);
            })
                .then((processedHistory: any) => {
                setWatchHistory(processedHistory);
                localStorage.setItem('selectedItems', JSON.stringify(processedHistory));
                })
                .catch((error: any) => {
                setError(error.message);
                })
                .finally(() => setIsLoading(false));
            } 
            
            // HTML 파일 파싱
            else if (file.name.endsWith('.html')) {
            parseWatchHistory(
                file,
                dateRange,
                maxVideosPerDay,
                setSuccessCount,
                fetchVideoInfo,
                setError,
                openai,
                OpenAILogger
            ).finally(() => setIsLoading(false));
            } else {
            setError('지원하지 않는 파일 형식입니다. .json 또는 .html 파일을 업로드해주세요.');
            setIsLoading(false);
            }
    }
} 