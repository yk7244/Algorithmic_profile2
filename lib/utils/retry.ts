/**
 * 네트워크 요청 재시도 유틸리티
 * DB 연결 불안정 문제 해결을 위한 재시도 로직
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * 비동기 함수를 재시도하는 유틸리티
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        console.log(`✅ 재시도 성공 (${attempt}/${maxAttempts})`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        console.error(`❌ 최대 재시도 횟수 도달 (${maxAttempts}/${maxAttempts})`);
        break;
      }

      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      
      console.warn(`⚠️ 시도 ${attempt}/${maxAttempts} 실패, ${currentDelay}ms 후 재시도...`, error);
      
      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError;
}

/**
 * Supabase 특화 재시도 함수
 */
export async function withSupabaseRetry<T>(
  fn: () => Promise<T>,
  context: string = 'Supabase 요청'
): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 3,
    delay: 1000,
    backoff: true,
    onRetry: (attempt, error) => {
      console.log(`🔄 ${context} 재시도 중... (${attempt}/3)`, {
        error: error.message || error,
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * 업로드 특화 재시도 함수 (더 긴 타임아웃)
 */
export async function withUploadRetry<T>(
  fn: () => Promise<T>,
  context: string = '업로드'
): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 5,
    delay: 2000,
    backoff: true,
    onRetry: (attempt, error) => {
      console.log(`📤 ${context} 재시도 중... (${attempt}/5)`, {
        error: error.message || error,
        timestamp: new Date().toISOString()
      });
    }
  });
}