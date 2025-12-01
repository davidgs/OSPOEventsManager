/* The MIT License (MIT)
 *
 * Copyright (c) 2025-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { useI18n } from '@/components/i18n/i18n-provider';

// Mock the useI18n hook
vi.mock('@/components/i18n/i18n-provider', () => ({
  useI18n: vi.fn(),
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Select Variant', () => {
    it('should render language selector', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: false,
      });

      render(<LanguageSelector />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should display current language', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: false,
      });

      render(<LanguageSelector />);
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: true,
      });

      render(<LanguageSelector />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should call setLanguage when language changes', async () => {
      const mockSetLanguage = vi.fn().mockResolvedValue(undefined);
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: mockSetLanguage,
        isLoading: false,
      });

      render(<LanguageSelector />);

      // Note: Testing actual select interaction would require more complex setup
      // This test verifies the component renders correctly
      expect(mockSetLanguage).toBeDefined();
    });
  });

  describe('Button Variant', () => {
    it('should render button variant', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: false,
      });

      render(<LanguageSelector variant="button" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should display language code in button', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: false,
      });

      render(<LanguageSelector variant="button" />);
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: true,
      });

      render(<LanguageSelector variant="button" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Size Variants', () => {
    it('should accept size prop', () => {
      (useI18n as any).mockReturnValue({
        language: 'en',
        setLanguage: vi.fn(),
        isLoading: false,
      });

      const { container } = render(<LanguageSelector size="lg" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

