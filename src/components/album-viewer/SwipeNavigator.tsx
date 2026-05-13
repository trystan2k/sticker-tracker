import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent
} from 'react';
import { useNavigate } from '@tanstack/react-router';
import { flushSync } from 'react-dom';

import { albumPages, type AlbumPage, type PageId } from '@/data/album';

import {
  SWIPE_THRESHOLD_PX,
  getActivePage,
  getAlbumPath,
  getNextPage,
  getPrevPage
} from './viewer-state';
import { QuickNavigationPicker } from './QuickNavigationPicker';

type SwipeNavigatorRenderProps = Readonly<{
  activePage: AlbumPage;
  activePageId: PageId;
  goToPage: (pageId: PageId) => void;
  openQuickNavigation: () => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}>;

type SwipeNavigatorProps = Readonly<{
  activePageId: PageId;
  children: ((props: SwipeNavigatorRenderProps) => ReactNode) | ReactNode;
}>;

type SwipeAxis = 'idle' | 'horizontal' | 'vertical';

export function SwipeNavigator({ activePageId, children }: SwipeNavigatorProps) {
  const navigate = useNavigate();
  const [isQuickNavigationOpen, setIsQuickNavigationOpen] = useState(false);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchEndYRef = useRef(0);
  const touchAxisRef = useRef<SwipeAxis>('idle');
  const swipeSurfaceRef = useRef<HTMLDivElement>(null);

  const activePage = useMemo(() => getActivePage(activePageId), [activePageId]);

  const navigateTo = useCallback(
    (targetPage: AlbumPage, direction: 'forward' | 'back') => {
      if (typeof document !== 'undefined' && document.startViewTransition) {
        const html = document.documentElement;
        html.classList.add(direction === 'forward' ? 'nav-forward' : 'nav-back');

        const transition = document.startViewTransition(() => {
          flushSync(() => {
            void navigate({ to: getAlbumPath(targetPage) });
          });
        });

        void transition.finished.finally(() => {
          html.classList.remove('nav-forward', 'nav-back');
        });
      } else {
        void navigate({ to: getAlbumPath(targetPage) });
      }
    },
    [navigate]
  );

  const goToPage = useCallback(
    (pageId: PageId): void => {
      if (pageId === activePageId) return;

      const targetPage = getActivePage(pageId);
      const currentIndex = albumPages.findIndex((p) => p.pageId === activePageId);
      const targetIndex = albumPages.findIndex((p) => p.pageId === targetPage.pageId);
      const direction: 'forward' | 'back' = targetIndex > currentIndex ? 'forward' : 'back';
      navigateTo(targetPage, direction);
    },
    [activePageId, navigateTo]
  );

  const goToNextPage = useCallback((): void => {
    const nextPage = getNextPage(activePageId);
    navigateTo(nextPage, 'forward');
  }, [activePageId, navigateTo]);

  const goToPrevPage = useCallback((): void => {
    const prevPage = getPrevPage(activePageId);
    navigateTo(prevPage, 'back');
  }, [activePageId, navigateTo]);

  const openQuickNavigation = useCallback((): void => {
    setIsQuickNavigationOpen(true);
  }, []);

  const closeQuickNavigation = useCallback((): void => {
    setIsQuickNavigationOpen(false);
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>): void => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchEndXRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;
    touchAxisRef.current = 'idle';
  }, []);

  const handleTouchMove = useCallback((event: globalThis.TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    touchEndXRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;

    const deltaX = Math.abs(touchEndXRef.current - touchStartXRef.current);
    const deltaY = Math.abs(touchEndYRef.current - touchStartYRef.current);

    if (touchAxisRef.current === 'idle') {
      if (deltaX > deltaY) {
        touchAxisRef.current = 'horizontal';
      } else if (deltaY > deltaX) {
        touchAxisRef.current = 'vertical';
      }
    }

    if (touchAxisRef.current === 'horizontal' && event.cancelable) {
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    const element = swipeSurfaceRef.current;
    if (!element) {
      return undefined;
    }

    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchMove]);

  const handleTouchEnd = useCallback((): void => {
    const deltaX = touchEndXRef.current - touchStartXRef.current;
    const deltaY = touchEndYRef.current - touchStartYRef.current;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (
      touchAxisRef.current !== 'horizontal' ||
      horizontalDistance < SWIPE_THRESHOLD_PX ||
      horizontalDistance <= verticalDistance
    ) {
      touchAxisRef.current = 'idle';
      return;
    }

    if (deltaX < 0) {
      goToNextPage();
    } else {
      goToPrevPage();
    }

    touchAxisRef.current = 'idle';
  }, [goToNextPage, goToPrevPage]);

  const renderProps: SwipeNavigatorRenderProps = {
    activePage,
    activePageId,
    goToPage,
    openQuickNavigation,
    goToNextPage,
    goToPrevPage
  };

  return (
    <div
      ref={swipeSurfaceRef}
      data-testid="swipe-surface"
      data-swipe-threshold={SWIPE_THRESHOLD_PX}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {typeof children === 'function' ? children(renderProps) : children}
      <QuickNavigationPicker
        isOpen={isQuickNavigationOpen}
        activePageId={activePageId}
        onClose={closeQuickNavigation}
      />
    </div>
  );
}
